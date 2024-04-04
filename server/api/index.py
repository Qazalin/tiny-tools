import json, functools, pickle, io, importlib, cgi
from typing import List
from http.server import BaseHTTPRequestHandler
import numpy as np

from tinygrad import Tensor
from tinygrad.codegen.linearizer import Linearizer, List
from tinygrad.engine.schedule import LoadOps, ScheduleItem, create_schedule
from tinygrad.nn import optim
from tinygrad.nn.state import get_parameters
from tinygrad.helpers import to_function_name
from tinygrad.renderer.cstyle import OpenCLRenderer
from tinygrad.nn import Conv2d, LayerNorm, LayerNorm2d, Linear, optim

class handler(BaseHTTPRequestHandler):
  def _set_headers(self):
    self.send_response(200)
    self.send_header('Content-type', 'application/json')
    self.send_header('Access-Control-Allow-Origin', '*')
    self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    self.send_header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type')
    self.end_headers()

  def do_OPTIONS(self):
    self._set_headers()

  def do_POST(self):
    ctype, pdict = cgi.parse_header(self.headers.get('content-type'))
    pdict['boundary'] = bytes(pdict['boundary'], "utf-8")
    assert ctype == 'multipart/form-data'
    fields = cgi.parse_multipart(self.rfile, pdict)
    nodes, edges = tiny_load(fields['file'][0])
    nodes = list(map(transform_node, nodes))
    self._set_headers()
    self.end_headers()
    return self.wfile.write(json.dumps({ "nodes": nodes, "edges": edges }, indent=None).encode('utf-8'))

  def do_GET(self):
    nodes, edges = _test_adam()
    self._set_headers()
    self.end_headers()
    self.wfile.write(json.dumps({ "nodes": nodes, "edges": edges }, indent=None).encode('utf-8'))
    return

def save_schedule_graph(schedule: List[ScheduleItem]):
  buf_schedules = {out: si for si in schedule for out in si.outputs}
  nodes, edges = [], []
  def _parse(i:int, si: ScheduleItem):
    return { 'id': str(i+1), 'ast': si.ast, 'inputs': list(map(str, si.inputs)), 'outputs': list(map(str, si.outputs))  }
  for i, si in enumerate(schedule):
    nodes.append(_parse(i, si))
    for x in si.inputs:
      if x not in buf_schedules: continue
      source_index = schedule.index(buf_schedules[x]) + 1
      edge_id = f"{source_index}-{i+1}"
      edges.append({'source': str(source_index), 'target': str(i+1), 'id': edge_id, 'label': edge_id})
  return pickle.dumps(nodes), pickle.dumps(edges)

class TinyUnpickler(pickle.Unpickler):
  def find_class(self, module: str, name: str):
    assert module in ["tinygrad.ops", "tinygrad.dtype", "tinygrad.shape.shapetracker", "tinygrad.shape.view"] \
        or (module == "tinygrad.tensor" and name == "custom_random"), f"forbidden object {module} {name}"
    return getattr(importlib.import_module(module), name)

def tiny_load(s): return TinyUnpickler(io.BytesIO(s)).load()

def graph(schedule: List[ScheduleItem]):
  nodes, edges = save_schedule_graph(schedule)
  return list(map(transform_node, tiny_load(nodes))), tiny_load(edges)

@functools.lru_cache(None)
def linearize_si(ast):
  lin = Linearizer(*ast)
  lin.linearize()
  return lin, to_function_name(lin.name)

def transform_node(src):
  node = {"id": src["id"], "inputs": src["inputs"], "outputs": src["outputs"]}
  if src["ast"][0].op not in LoadOps:
    lin, name = linearize_si(src["ast"])
    node["fill"] = "red" if name.startswith("r_") else "blue"
    node["code"] = OpenCLRenderer(name, lin.uops)
    node["label"] = name
    node["shape"] = ""
  else:
    node["fill"] = "white"
    node["code"], node["shape"] = "", ""
    node["label"] = str(src["ast"][0].op)
  return node

def _get_sched_conv():
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
  optimizer = optim.SGD(get_parameters(model), lr=0.001)
  X, Y = np.zeros((2,3,224,224), dtype=np.float32), np.zeros((2), dtype=np.float32)
  return graph(_schedule_train_step(X, Y, model, optimizer))

def _test_adam():
  class TinyBobNet:
    def __init__(self):
      self.l1 = Tensor.scaled_uniform(784, 128)
      self.l2 = Tensor.scaled_uniform(128, 10)
    def parameters(self): return get_parameters(self)
    def __call__(self, x): return x.dot(self.l1).relu().dot(self.l2)
  model = TinyBobNet()
  optimizer = optim.Adam(model.parameters(), lr=0.001)
  X, Y = np.zeros((60000, 784), dtype=np.float32), np.zeros((60000,), dtype=np.float32)
  return graph(_schedule_train_step(X, Y, model, optimizer))

def my_step(opt):
  extra = opt._step()
  return extra + opt.params + opt.buffers if extra is not None else opt.params + opt.buffers
def _schedule_train_step(X, Y, model, optimizer):
  with Tensor.train():
    samp = np.random.randint(0, X.shape[0], size=(2))
    x, y = Tensor(X[samp], requires_grad=False), Tensor(Y[samp])
    out = model(x)
    loss = out.sparse_categorical_crossentropy(y)
    optimizer.zero_grad()
    loss.backward()
    return create_schedule([x.lazydata for x in my_step(optimizer)])
