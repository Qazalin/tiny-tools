import pickle, os, json
from dataclasses import dataclass, asdict
from typing import Dict, List, Tuple

from tinygrad.ops import UOp
from tinygrad.engine.graph import uops_colors

# *** GraphNode return type

INPUT_FP = os.getenv("INPUT_FP", "/uop.pkl")
OUTPUT_FP = os.getenv("OUTPUT_FP", "/uop.json")

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

def to_uop_node(id:str, uop:UOp) -> UOpNode:
  return UOpNode(id, uops_colors.get(uop.op, "white"), str(uop.op), str(uop.op), str(uop.dtype), str(uop), str(uop.arg))

def load_uops(data:List[Tuple[UOp, UOp]]):
  nodes: List[UOpNode] = []
  edges: List[Dict[str, str]] = []
  for sink_id, (prev, _rw) in enumerate(data):
    uops = list(prev.sparents)
    for uid, x in enumerate(uops):
      nodes.append(to_uop_node(f"{sink_id}-{uid}", x))
      for y in x.src:
        input_idx = uops.index(y)
        edge_id = f"{sink_id}-{input_idx}-{uid}"
        edges.append({"source": f"{sink_id}-{input_idx}", "target": f"{sink_id}-{uid}", "id": edge_id, "label": edge_id})
  return nodes, edges

# *** unpickler

if __name__ == "__main__":
  with open(INPUT_FP, "rb") as f: s = f.read()
  with open(INPUT_FP, "rb") as f: data: List[Tuple[UOp, UOp]] = pickle.load(f)
  nodes, edges = load_uops(data)
  with open(OUTPUT_FP, "w") as fh: fh.write(json.dumps({"nodes": list(map(asdict, nodes)), "edges": edges }))
