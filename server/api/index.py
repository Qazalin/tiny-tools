import json
from http.server import BaseHTTPRequestHandler
from tinygrad.codegen.linearizer import Linearizer
from tinygrad import Tensor
from tinygrad.engine.schedule import create_schedule
from tinygrad.renderer.cstyle import MetalRenderer

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
    a = Tensor([1])
    b = Tensor([2])
    out = a + b
    si = create_schedule([out.lazydata])[-1]
    lin = Linearizer(*si.ast)
    lin.linearize()
    code = MetalRenderer(lin.name, lin.uops)
    self._set_headers()
    self.wfile.write(json.dumps({ "code": code }).encode('utf-8'))
    return
