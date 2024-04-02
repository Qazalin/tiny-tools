from http.server import BaseHTTPRequestHandler
from tinygrad.codegen.linearizer import Linearizer
from tinygrad import Tensor
from tinygrad.engine.schedule import create_schedule
from tinygrad.renderer.cstyle import MetalRenderer

class handler(BaseHTTPRequestHandler):
  def do_GET(self):
    a = Tensor([1])
    b = Tensor([2])
    out = a + b
    si = create_schedule([out.lazydata])[-1]
    lin = Linearizer(*si.ast)
    lin.linearize()
    code = MetalRenderer(lin.name, lin.uops)
    self.send_response(200)
    self.send_header('Content-type','text/plain')
    self.end_headers()
    self.wfile.write(code.encode('utf-8'))
    return
