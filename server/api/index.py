import json, os, redis
from urllib.parse import urlparse, parse_qs
from typing import cast
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
  def _set_headers(self):
    self.send_response(200)
    self.send_header('Content-type', 'application/json')
    self.send_header('Access-Control-Allow-Origin', '*')
    self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT')
    self.send_header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type')
    self.end_headers()

  def do_OPTIONS(self): self._set_headers()

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
