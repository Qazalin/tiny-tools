import functools, re, pickle, importlib, io, json, random
from typing import Dict
from tinygrad.ops import LazyOp, MetaOps
from tinygrad.codegen.kernel import Kernel
from tinygrad.helpers import to_function_name
from tinygrad.renderer.cstyle import OpenCLRenderer

class Buffer:
  def __init__(self, device:str, size:int, dtype, opaque=None, options=None, initial_value=None, lb_refcount=0, base=None, offset:int=0, preallocate=False) -> None:
    self.device, self.size, self.dtype, self._lb_refcount = device, size, dtype, lb_refcount
    if opaque is not None: self._buf = opaque
    if initial_value is not None: self._buf = initial_value
  def __repr__(self): return f"<buf real:{hasattr(self, '_buf')} device:{self.device} size:{self.size} dtype:{self.dtype}>"
  def ref(self): return

@functools.lru_cache(None)
def cached_linearize(ast:LazyOp) -> Kernel:
  lin = Kernel(ast, opts=OpenCLRenderer())
  lin.linearize()
  return lin

ref_fills: Dict[int, str] = {}
def transform_node(src):
  node = {**src}
  if src["ast"].op is MetaOps.SINK:
    try:
      lin = cached_linearize(src["ast"])
      name = to_function_name(lin.name)
      node["fill"] = "green" if bool(re.search(r'r\d', name)) else "red" if name.startswith("r") else "green" if bool(re.search(r'E\d', name)) else "yellow" if "ASSIGN" in str(src["outputs"]) else "blue"
      node["code"] = OpenCLRenderer().render(name, lin.uops)
      node["label"] = name
    except Exception as e:
      print("FAILED TO LINEARIZE", e, src["ast"])
      node["code"] = "idk"
      node["label"] = "lol"
      node["fill"] = "orange"
    node["ast"] = str(src["ast"])
    node["shape"] = str(src["ast"].src[0].arg.st.shape)
    node["full_shape"] = src["full_shape"]
    node["metadata"] = src["metadata"]
    node["category"] = src["metadata"].split("-")[0].strip().replace("[", "").replace("]", "")
  else:
    node["fill"] = "white"
    node["code"], node["shape"] = "", ""
    node["label"] = str(src["ast"].op)
    node["ast"] = ""
    node["full_shape"] = ""
    node["metadata"] = src["metadata"]
    node["category"] = ""
  if int(node["ref"]) > 10:
    if node["ref"] in ref_fills: node["fill"] = ref_fills[node["ref"]]
    else: node["fill"] = ref_fills[node["ref"]] = "#" + hex(random.randrange(0, 2**24))[2:]
  #else: node["fill"] = "white"
  return node

def _parse(gi: int, i:int, si): return transform_node({ 'id': f"{gi}-{str(i)}", 'ast': si.ast, 'inputs': list(map(str, si.inputs)), 'outputs': list(map(str, si.outputs)), "ref": str(si.outputs[0].buffer._lb_refcount), "forced_realize": si.outputs[0].forced_realize, "full_shape": str(si.ast.full_shape), "metadata": str(si.metadata), })

def load_schedule(data):
  nodes, edges = [], []
  for gi, (graph, prescheduled) in enumerate(data):
    buf_schedules = {out: si for si in prescheduled.values() for out in si.outputs}
    for i, (key, ps) in enumerate(prescheduled.items()):
      if str(ps.ast.op) != "MetaOps.SINK": continue
      nodes.append(_parse(gi, i, ps))
      for x in graph[key]:
        if x not in buf_schedules: continue
        child_idx = list(prescheduled).index(buf_schedules[x].outputs[0])
        edge_id = f"{gi}-{i+1}-{child_idx}"
        edges.append({'source': f"{gi}-{i}", 'target': f"{gi}-{child_idx}", 'id': edge_id, 'label': edge_id})
  return nodes, edges

class TinyUnpickler(pickle.Unpickler):
  def find_class(self, module: str, name: str):
    if module == "tinygrad.device" and name == "Buffer": return Buffer
    return getattr(importlib.import_module(module), name)

if __name__ == "__main__":
  with open("/sched.pkl", "rb") as f: s = f.read()
  data = TinyUnpickler(io.BytesIO(s)).load()
  nodes, edges = load_schedule(data)
  with open("/sched.json", "w") as fh: fh.write(json.dumps({"nodes": nodes, "edges": edges }))
