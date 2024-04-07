import json, functools, pickle, io, importlib, cgi, os, redis, uuid
from urllib.parse import urlparse, parse_qs
from typing import cast
from http.server import BaseHTTPRequestHandler
from tinygrad.codegen.linearizer import Linearizer

from tinygrad.helpers import to_function_name
from tinygrad.ops import LazyOp, LoadOps
from tinygrad.renderer.cstyle import OpenCLRenderer
from tinygrad.features.graph import _tree

class handler(BaseHTTPRequestHandler):
  def _set_headers(self):
    self.send_response(200)
    self.send_header('Content-type', 'application/json')
    self.send_header('Access-Control-Allow-Origin', '*')
    self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT')
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

  def do_PUT(self):
    content_length = int(self.headers['Content-Length'])
    data = json.loads(self.rfile.read(content_length))
    assert_valid(data)
    r = redis.Redis(host=getenv("REDIS_HOST"), port=33331, password=getenv("REDIS_PASSWORD"), ssl=True)
    r.set(share_id:=uuid.uuid4().hex, json.dumps(data, indent=None))
    self._set_headers()
    self.end_headers()
    return self.wfile.write(json.dumps({ "id": share_id }, indent=None).encode('utf-8'))

  def do_GET(self):
    self._set_headers()
    query_params = parse_qs(urlparse(self.path).query)
    query_id = query_params.get('id', [None])[0]
    if query_id is None: return self.wfile.write(json.dumps({ "ok": True }, indent=None).encode('utf-8'))
    r = redis.Redis(host=getenv("REDIS_HOST"), port=33331, password=getenv("REDIS_PASSWORD"), ssl=True)
    return self.wfile.write(cast(bytes, r.get(query_id)))

def getenv(name: str):
  assert (val:=os.getenv(name))
  return val

class TinyUnpickler(pickle.Unpickler):
  def find_class(self, module: str, name: str):
    assert module in ["tinygrad.ops", "tinygrad.dtype", "tinygrad.shape.shapetracker", "tinygrad.shape.view"] \
        or (module == "tinygrad.tensor" and name == "custom_random"), f"forbidden object {module} {name}"
    return getattr(importlib.import_module(module), name)

def tiny_load(s): return TinyUnpickler(io.BytesIO(s)).load()

def transform_node(src):
  node = {"id": src["id"], "inputs": src["inputs"], "outputs": src["outputs"]}
  if src["ast"][0].op not in LoadOps:
    lin = cached_linearize(*src["ast"])
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

def assert_valid(data):
  assert "nodes" in data and "edges" in data and len(data.keys()) == 2
  required, optional = {"id", "inputs", "outputs", "fill", "label", "shape"}, {"code", "ast"}
  assert isinstance(data["nodes"], list) and isinstance(data["edges"], list)
  for node in data["nodes"]:
    assert isinstance(node, dict)
    assert not required - (fields:=set(node.keys())) and not fields - required - optional, f"got {set(node.keys())}"
    assert isinstance(node["id"], str)
    assert isinstance(node["inputs"], list)
    assert isinstance(node["outputs"], list)
    assert isinstance(node["fill"], str)
    assert isinstance(node["label"], str)
    assert isinstance(node["shape"], str)
    if "ast" in node: assert isinstance(node["ast"], str)
    if "code" in node: assert isinstance(node["code"], str)
  required = {"source", "target", "id", "label"}
  for edge in data["edges"]:
    assert isinstance(edge, dict)
    assert not required - (fields:=set(edge.keys())) and not fields - required
    for k in required: assert isinstance(edge[k], str)

@functools.lru_cache(None)
def cached_linearize(*ast:LazyOp) -> Linearizer:
  lin= Linearizer(*ast)
  lin.linearize()
  return lin
