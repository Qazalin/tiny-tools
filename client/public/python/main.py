import re, pickle, importlib, io, json, os
from dataclasses import dataclass, field, asdict
from typing import DefaultDict, Dict, List, Optional, Tuple
from tinygrad.ops import MetaOps, UOp, UOps
from tinygrad.codegen.kernel import Kernel
from tinygrad.renderer import Program
from tinygrad.renderer.cstyle import OpenCLRenderer
from tinygrad.engine.schedule import LBScheduleItem

# *** GraphNode return type

INPUT_FP = os.getenv("INPUT_FP", "/graph.pkl")
OUTPUT_FP = os.getenv("OUTPUT_FP", "/graph.json")

@dataclass(frozen=True)
class GraphNode:
  id: str
  fill: str
  label: str

@dataclass(frozen=True)
class ScheduleNode(GraphNode):
  code: str = ""
  inputs: List[str] = field(default_factory=list)
  outputs: List[str] = field(default_factory=list)
  shape: str = ""
  full_shape: str = ""
  metadata: str = ""
  category: str = ""
  forced_realize: bool = False
  ast: Optional[str] = None
  ref: Optional[str] = None

# *** transform LBScheduleItem to GraphNode

def color_graph(name:str) -> str:
  # multi output
  if bool(re.search(r'r\d', name)) or bool(re.search(r'E\d', name)): return "green"
  # r_
  if name.startswith("r"): return "red"
  # E_
  return "blue"

method_cache: Dict[bytes, Program] = {}
def cached_linearize(ast:UOp) -> Program:
  if ast.key in method_cache: return method_cache[ast.key]
  return method_cache.setdefault(ast.key, Kernel(ast, opts=OpenCLRenderer()).to_program())

def to_schedule_node(id:str, lsi:LBScheduleItem) -> ScheduleNode:
  if lsi.ast.op is not UOps.SINK: return ScheduleNode(id, fill="white", label=str(lsi.ast.op))
  try: prg = cached_linearize(lsi.ast)
  except Exception as e:
    print(f"FAILED TO LINEARIZE {lsi.ast} {e}")
    return ScheduleNode(id, fill="orange", label="INVALID")
  return ScheduleNode(id,
      fill="yellow" if any(x.op is MetaOps.ASSIGN for x in lsi.outputs) else color_graph(prg.function_name),
      label=prg.function_name, code=prg.src,
      inputs=list(map(str, lsi.inputs)), outputs=list(map(str, lsi.outputs)),
      shape=str(lsi.outputs[0].shape), full_shape=str(lsi.ast.full_shape),
      metadata=str(list(map(str, lsi.metadata))), category=str(lsi.metadata[0]),
      forced_realize=any(x.forced_realize for x in lsi.outputs), ast=str(lsi.ast), ref=str(lsi.outputs[0].buffer._lb_refcount))

def load_schedule(data:List[Tuple[DefaultDict[LBScheduleItem, List[LBScheduleItem]], DefaultDict[LBScheduleItem, int]]]) -> Tuple[List[ScheduleNode], List[Dict[str, str]]]:
  nodes: List[ScheduleNode] = []
  edges: List[Dict[str, str]] = []
  for gi, (graph, in_degree) in enumerate(data):
    schedule_items = list(in_degree)
    for i, lsi in enumerate(schedule_items):
      nodes.append(to_schedule_node(f"{gi}-{i}", lsi))
      for x in graph[lsi]:
        if x not in schedule_items: continue
        child_idx = schedule_items.index(x)
        edge_id = f"{gi}-{i+1}-{child_idx}"
        edges.append({'source': f"{gi}-{i}", 'target': f"{gi}-{child_idx}", 'id': edge_id, 'label': edge_id})
  return nodes, edges

# *** unpickler to deal with browser limitations

class Buffer:
  def __init__(self, device:str, size:int, dtype, opaque=None, options=None, initial_value=None, lb_refcount=0, base=None, offset:int=0, preallocate=False) -> None:
    self.device, self.size, self.dtype, self._lb_refcount = device, size, dtype, lb_refcount
    if opaque is not None: self._buf = opaque
    if initial_value is not None: self._buf = initial_value
  def __repr__(self): return f"<buf real:{hasattr(self, '_buf')} device:{self.device} size:{self.size} dtype:{self.dtype}>"
  def ref(self, _): return
class TinyUnpickler(pickle.Unpickler):
  def find_class(self, module:str, name:str):
    if module == "tinygrad.device" and name == "Buffer": return Buffer
    return getattr(importlib.import_module(module), name)

if __name__ == "__main__":
  with open(INPUT_FP, "rb") as f: s = f.read()
  data = TinyUnpickler(io.BytesIO(s)).load()
  nodes, edges = load_schedule(data)
  ret = {"graphs": [{"nodes": list(map(asdict, nodes)), "edges": edges }]}
  with open(OUTPUT_FP, "w") as fh: fh.write(json.dumps(ret))
