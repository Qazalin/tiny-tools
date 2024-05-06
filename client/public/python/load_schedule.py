import functools, re, pickle, importlib, io, json
from tinygrad.ops import List, ScheduleItem, LazyOp, LoadOps
from tinygrad.codegen.linearizer import Linearizer
from tinygrad.helpers import to_function_name
from tinygrad.renderer.cstyle import OpenCLRenderer
from tinygrad.features.graph import _tree
from tinygrad.device import CompilerOptions

class Buffer:
  def __init__(self, device:str, size:int, dtype, opaque=None, options=None, initial_value=None, lb_refcount=0) -> None:
    self.device, self.size, self.dtype, self._lb_refcount = device, size, dtype, lb_refcount
    if opaque is not None: self._buf = opaque
    if initial_value is not None: self._buf = initial_value
  def __repr__(self): return f"<buf real:{hasattr(self, '_buf')} device:{self.device} size:{self.size} dtype:{self.dtype}>"
  def ref(self): return

@functools.lru_cache(None)
def cached_linearize(*ast:LazyOp) -> Linearizer:
  lin= Linearizer(*ast, opts=CompilerOptions("GPU"))
  lin.linearize()
  return lin

def transform_node(src):
  node = {**src}
  if src["ast"][0].op not in LoadOps:
    try:
      lin = cached_linearize(*src["ast"])
      name = to_function_name(lin.name)
      node["fill"] = "green" if bool(re.search(r'r\d', name)) else "red" if name.startswith("r") else "green" if bool(re.search(r'E\d', name)) else "yellow" if "ASSIGN" in str(src["outputs"]) else "blue"
      node["code"] = OpenCLRenderer(name, lin.uops)
      node["label"] = name
    except:
      node["code"] = "idk"
      node["label"] = "lol"
      node["fill"] = "orange"
    node["ast"] = "\n".join(["\n".join([f"{str(i).rjust(3)} {s}" for i,s in enumerate(_tree(op, {}, [-1]))]) for op in src["ast"]])
    node["shape"] = str(src["ast"][0].arg.st.shape)
  else:
    node["fill"] = "white"
    node["code"], node["shape"] = "", ""
    node["label"] = str(src["ast"][0].op)
    node["ast"] = ""
  return node

def _parse(gi: int, i:int, si): return transform_node({ 'id': f"{gi}-{str(i)}", 'ast': si.ast, 'inputs': list(map(str, si.inputs)), 'outputs': list(map(str, si.outputs)), "ref": str(si.outputs[0].buffer._lb_refcount), "forced_realize": si.outputs[0].forced_realize })

nodes, edges = [], []
class TinyUnpickler(pickle.Unpickler):
  def find_class(self, module: str, name: str):
    if module == "tinygrad.buffer" and name == "Buffer": return Buffer
    return getattr(importlib.import_module(module), name)
with open("/sched.pkl", "rb") as f: s = f.read()
data = TinyUnpickler(io.BytesIO(s)).load()
if isinstance(data, List) and len(data) and isinstance(data[0], ScheduleItem):
  schedule: List[ScheduleItem] = data
  buf_schedules = {out: si for si in schedule for out in si.outputs}
  for i, si in enumerate(schedule):
    nodes.append(_parse(0, i, si))
    for x in si.inputs:
      if x not in buf_schedules: continue
      source_index = schedule.index(buf_schedules[x]) + 1
      edge_id = f"{source_index}-{i+1}"
      edges.append({'source': str(source_index), 'target': str(i+1), 'id': edge_id, 'label': edge_id})
else:
  for gi, (graph, prescheduled) in enumerate(data):
    buf_schedules = {out: si for si in prescheduled.values() for out in si.outputs}
    for i, (key, ps) in enumerate(prescheduled.items()):
      nodes.append(_parse(gi, i, ps))
      for x in graph[key]:
        if x not in buf_schedules: continue
        child_sched = buf_schedules[x]
        child_idx = list(prescheduled).index(buf_schedules[x].outputs[0])
        edge_id = f"{gi}-{i+1}-{child_idx}"
        edges.append({'source': f"{gi}-{i}", 'target': f"{gi}-{child_idx}", 'id': edge_id, 'label': edge_id})

with open("/sched.json", "w") as fh: fh.write(json.dumps({"nodes": nodes, "edges": edges}))
