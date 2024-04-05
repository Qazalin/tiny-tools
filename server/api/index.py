import json, functools, pickle, io, importlib, cgi
from http.server import BaseHTTPRequestHandler
from tinygrad.codegen.kernel import Device

from tinygrad.helpers import to_function_name
from tinygrad.ops import LoadOps
from tinygrad.renderer.cstyle import OpenCLRenderer
from tinygrad.features.graph import _tree

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
    self._set_headers()
    self.end_headers()
    return self.wfile.write(json.dumps({ "nodes": list(map(transform_node, nodes)), "edges": edges }, indent=None).encode('utf-8'))

class TinyUnpickler(pickle.Unpickler):
  def find_class(self, module: str, name: str):
    assert module in ["tinygrad.ops", "tinygrad.dtype", "tinygrad.shape.shapetracker", "tinygrad.shape.view"] \
        or (module == "tinygrad.tensor" and name == "custom_random"), f"forbidden object {module} {name}"
    return getattr(importlib.import_module(module), name)

def tiny_load(s): return TinyUnpickler(io.BytesIO(s)).load()

def transform_node(src):
  node = {"id": src["id"], "inputs": src["inputs"], "outputs": src["outputs"]}
  if src["ast"][0].op not in LoadOps:
    lin = Device[Device.DEFAULT].get_linearizer(*src["ast"])
    lin.linearize()
    name = to_function_name(lin.name)
    node["fill"] = "red" if name.startswith("r") else "blue"
    node["code"] = OpenCLRenderer(name, lin.uops)
    node["label"] = name
    node["shape"] = str(src["ast"][0].arg.st.shape)
    node["ast"] = "\n".join(["\n".join([f"{str(i).rjust(3)} {s}" for i,s in enumerate(_tree(op, {}, [-1]))]) for op in src["ast"]])

  else:
    node["fill"] = "white"
    node["code"], node["shape"] = "", ""
    node["label"] = str(src["ast"][0].op)
  return node
