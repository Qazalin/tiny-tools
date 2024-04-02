import json
from typing import List, Dict, Set, DefaultDict, Tuple
from http.server import BaseHTTPRequestHandler
from collections import defaultdict, deque

from tinygrad import Device, Tensor
from tinygrad.codegen.linearizer import BinaryOps, BufferOps, LazyOp, List, TernaryOps, UnaryOps
from tinygrad.engine.schedule import _LBScheduleItem, _recurse_lb, _schedule_one, _is_padding_okay
from tinygrad.ops import LoadOps, ReduceOps
from tinygrad.features.graph import realized_lazybuffer
from tinygrad.helpers import GRAPH, GlobalCounters, dedup
from tinygrad.lazy import LazyBuffer
from tinygrad.shape.shapetracker import ShapeTracker

class handler(BaseHTTPRequestHandler):
  def _set_headers(self):
    self.send_response(200)
    self.send_header('Content-type', 'application/json')
    self.send_header('Access-Control-Allow-Origin', '*')
    self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
    self.send_header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type')
    self.end_headers()

  def do_OPTIONS(self):
    self._set_headers()

  def do_GET(self):
    nodes, edges = graph_schedule(_get_sched())
    self._set_headers()
    self.wfile.write(json.dumps({ "nodes": nodes, "edges": edges }, indent=None).encode('utf-8'))
    return

def _get_sched() -> List[_LBScheduleItem]:
  from tinygrad import Tensor
  import numpy as np
  from tinygrad.nn import Conv2d, LayerNorm, LayerNorm2d, Linear, optim
  from tinygrad.nn.state import get_parameters

  class Block:
    def __init__(self, dim):
      self.dwconv = Conv2d(dim, dim, kernel_size=7, padding=3, groups=dim)
      self.norm = LayerNorm(dim, eps=1e-6)
      self.pwconv1 = Linear(dim, 4 * dim)
      self.pwconv2 = Linear(4 * dim, dim)
      self.gamma = Tensor.ones(dim)

    def __call__(self, x:Tensor):
      return x + x.sequential([
        self.dwconv, lambda x: x.permute(0, 2, 3, 1), self.norm,
        self.pwconv1, Tensor.gelu, self.pwconv2, lambda x: (self.gamma * x).permute(0, 3, 1, 2)
      ])

  class ConvNeXt:
    def __init__(self, in_chans=3, num_classes=1000, depths=[3, 3, 9, 3], dims=[96, 192, 384, 768]):
      self.downsample_layers = [
        [Conv2d(in_chans, dims[0], kernel_size=4, stride=4), LayerNorm2d(dims[0], eps=1e-6)],
        *[[LayerNorm2d(dims[i], eps=1e-6), Conv2d(dims[i], dims[i+1], kernel_size=2, stride=2)] for i in range(len(dims)-1)]
      ]
      self.stages = [[Block(dims[i]) for _ in range(depths[i])] for i in range(len(dims))]
      self.norm = LayerNorm(dims[-1])
      self.head = Linear(dims[-1], num_classes)

    def __call__(self, x:Tensor):
      for downsample, stage in zip(self.downsample_layers, self.stages):
        x = x.sequential(downsample).sequential(stage)
      return x.mean([-2, -1]).sequential([self.norm, self.head])

  model = ConvNeXt(depths=[1], dims=[16])
  X, Y = np.zeros((2,3,224,224), dtype=np.float32), np.zeros((2), dtype=np.float32)
  optimizer = optim.SGD(get_parameters(model), lr=0.001)
  with Tensor.train():
    samp = np.random.randint(0, X.shape[0], size=(2))
    x, y = Tensor(X[samp], requires_grad=False), Tensor(Y[samp])
    out = model(x)
    loss = out.sparse_categorical_crossentropy(y)
    optimizer.zero_grad()
    loss.backward()

    return create_schedule_graphable([x.lazydata for x in optimizer.step2()])
    out = Tensor([1,2,3,4]) + Tensor([3,4,5,6])
    return create_schedule_graphable([out.lazydata])
   

top_colors = {LoadOps: '#FFFFa0', UnaryOps: "#c0c0c0", ReduceOps: "#FFA0A0", BinaryOps: "#c0c0c0",
              TernaryOps: "#c0c0c0", BufferOps: '#a0a0ff'}
def get_ast_color(ast:Tuple[LazyOp, ...]): return [v for k,v in top_colors.items() if ast[0].src[0].op in k][0]
def graph_schedule(schedule: List[_LBScheduleItem]):
  lb_schedules = {out: si for si in schedule for out in si.outputs}
  nodes, edges = [], []
  
  for i, si in enumerate(schedule):
    code = "" if si.ast[0].op in LoadOps else Device["METAL"].get_runner(*si.ast).prg
    label = si.ast[0].op.name if si.ast[0].op in LoadOps else Device["METAL"].get_runner(*si.ast).name
    fillcolor = "#ffc0c0" if si.ast[0].op in LoadOps else get_ast_color(si.ast)
    inputs, outputs = [str(lb) for lb in si.inputs], [str(lb) for lb in si.outputs]
    nodes.append({'id': str(i+1), 'label': label, 'fill': fillcolor, 'code': code, 'inputs': inputs, 'outputs': outputs})
    for x in si.inputs:
      if x not in lb_schedules: continue
      source_index = schedule.index(lb_schedules[x]) + 1
      edge_id = f"{source_index}-{i+1}"
      edges.append({'source': str(source_index), 'target': str(i+1), 'id': edge_id, 'label': edge_id})

  return nodes, edges

def create_schedule_graphable(outs: List[LazyBuffer]) -> List[_LBScheduleItem]:
  seen = set()
  # start by just realizing the buffers passed in
  realizes: Set[LazyBuffer] = set([x.base for x in outs if not x.base.realized])
  allbufs: Dict[LazyBuffer, None] = {}
  simple_pads: Set[LazyBuffer] = set()
  children: DefaultDict[LazyBuffer, Dict[LazyBuffer, None]] = defaultdict(dict)
  for out in outs: _recurse_lb(out.base, realizes, allbufs, simple_pads, children, scheduled=True)

  # check if we have to realize pads
  for p in simple_pads:
    if not _is_padding_okay(p, realizes):
      realizes.add(p)

  # find all reduces, and pair them to a elementwise op. if they can't be cleanly paired, force realize the reduce (or a contig child)
  reduce_for_op: Dict[LazyBuffer, LazyBuffer] = {}
  for r in allbufs.keys():
    if r != r.base or r.op not in ReduceOps or r in realizes: continue

    # follow the reduce down
    child_set: Dict[LazyBuffer, ShapeTracker] = {r: r.st}
    realized_children: Dict[LazyBuffer, ShapeTracker] = {}
    forced_realize = False
    can_chase = True
    while not forced_realize and len(child_set):
      next_child_set = {}
      for tr,st in child_set.items():
        if tr in realizes:
          realized_children[tr] = st
          # can only have one output buffer
          # can only reduce contiguous
          # max one reduceop per kernel
          if len(realized_children) > 1 or not st.contiguous or st.size != r.st.size or (tr in reduce_for_op and reduce_for_op[tr] != r):
            can_chase = tr not in reduce_for_op or reduce_for_op[tr] == r
            forced_realize = True
            break
          continue
        for tr_next in children[tr].keys():
          if not tr_next.realized:
            # max one reduceop per kernel
            if tr_next.op in ReduceOps:
              forced_realize = True
              break
            st_childs = dedup([s for s in tr_next.srcs if s.base == tr])
            if len(st_childs) > 1:
              forced_realize = True
              break
            next_child_set[tr_next] = st + st_childs[0].st
      child_set = next_child_set
    if forced_realize:
      tr = r
      if can_chase:
        # can chase this down to contiguous children
        st = tr.st
        while len(children[tr]) == 1:
          tr_next = next(iter(children[tr].keys()))
          st_childs = dedup([s for s in tr_next.srcs if s.base == tr])
          if len(st_childs) > 1: break
          if st.size != st_childs[0].st.size: break
          st = st + st_childs[0].st
          if not st.contiguous or tr_next.op in ReduceOps: break
          tr = tr_next
        reduce_for_op[tr] = r
      realizes.add(tr)
    else:
      assert len(realized_children) == 1
      reduce_for_op[next(iter(realized_children.keys()))] = r

  # preschedule all buffers in realizes
  prescheduled = {x:_schedule_one(x, realizes, reduce_for_op) for x in realizes if x not in seen and x.realized is None and x.op is not LoadOps.CONST}
  assign_targets = {x.srcs[1]:x for x in realizes if x.op is LoadOps.ASSIGN and x not in seen and x.realized is None}

  # breadth first ordering
  graph: DefaultDict[LazyBuffer, List[LazyBuffer]] = defaultdict(list)
  in_degree: DefaultDict[LazyBuffer, int] = defaultdict(int)
  for out, si in prescheduled.items():
    for x in si.inputs:
      graph[x].append(out)
      if x in assign_targets:
        graph[out].append(assign_targets[x])
        in_degree[assign_targets[x]] += 1
      if x in prescheduled: in_degree[out] += 1
    del out.srcs  # can only schedule once

  queue = deque(out for out in prescheduled if in_degree[out] == 0)
  schedule: List[_LBScheduleItem] = []
  kernel_number = GlobalCounters.kernel_count
  while queue:
    buf = queue.popleft()
    seen.add(buf)
    ps = prescheduled[buf]
    if GRAPH:
      kernel_number += 1
      for out in ps.outputs: realized_lazybuffer(out, kernel_number)
    schedule.append(ps)
    for x in graph[buf]:
      in_degree[x] -= 1
      if in_degree[x] == 0: queue.append(x)

  # confirm everything was scheduled correctly
  if not all(degree == 0 for degree in in_degree.values()) or len(prescheduled) != len(schedule):
    raise RuntimeError(f"cycle detected in graph, prescheduled {len(prescheduled)} but only scheduled {len(schedule)}")
  return schedule
