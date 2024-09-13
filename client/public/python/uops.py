import os
from dataclasses import dataclass, asdict
from typing import Dict, List, Tuple

from tinygrad.ops import UOp, UOps
from tinygrad.engine.graph import uops_colors

# *** GraphNode return type

INPUT_FP = os.getenv("INPUT_FP", "/sched.pkl")
OUTPUT_FP = os.getenv("OUTPUT_FP", "/sched.json")

@dataclass(frozen=True)
class GraphNode:
  id: str
  fill: str
  label: str

@dataclass(frozen=True)
class UOpNode(GraphNode):
  op: str
  dtype: str
  src: str
  arg: str

def get_label(uop:UOp) -> str:
  if uop.op in {UOps.CONST, UOps.ALU}: return f"{uop.op} {uop.arg}"
  return str(uop.op)

def to_uop_node(id:str, uop:UOp) -> UOpNode:
  return UOpNode(id, uops_colors.get(uop.op, "white"), get_label(uop), str(uop.op), str(uop.dtype), str(uop), str(uop.arg))

def load_uops(data:Dict[int, List[Tuple[UOp, UOp]]]) -> List[Dict]:
  ret = []
  for _, rewrites in data.items():
    nodes: List[UOpNode] = []
    edges: List[Dict[str, str]] = []
    for sink_id, (prev, _rw) in enumerate(rewrites):
      uops = list(prev.sparents)
      for uid, x in enumerate(uops):
        nodes.append(to_uop_node(f"{sink_id}-{uid}", x))
        for y in x.src:
          input_idx = uops.index(y)
          edge_id = f"{sink_id}-{input_idx}-{uid}"
          edges.append({"source": f"{sink_id}-{input_idx}", "target": f"{sink_id}-{uid}", "id": edge_id, "label": edge_id})
    ret.append({"nodes": list(map(asdict, nodes)), "edges": edges })
  return ret
