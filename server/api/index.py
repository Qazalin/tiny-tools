import json, os, redis, requests, subprocess
from urllib.parse import urlparse, parse_qs
from typing import cast
from http.server import BaseHTTPRequestHandler


GH_TOKEN = subprocess.getoutput("gh auth token")
GH_HEADERS = {"Authorization": f"Bearer {GH_TOKEN}", "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}

class handler(BaseHTTPRequestHandler):
  def _set_headers(self):
    self.send_response(200)
    self.send_header('Access-Control-Allow-Origin', '*')
    self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT')
    self.send_header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type')
    self.end_headers()

  def do_OPTIONS(self): self._set_headers()

  def do_GET(self):
    self._set_headers()
    if "stats" not in self.path:
      self.send_header('Content-type', 'application/octet-stream')
      query_params = parse_qs(urlparse(self.path).query)
      query_id = query_params.get('id', [None])[0]
      if query_id is None:
        return self.wfile.write(json.dumps({ "ok": True }, indent=None).encode('utf-8'))
      r = redis.Redis(host=getenv("REDIS_HOST"), port=6379, password=getenv("REDIS_PASSWORD"), ssl=True)
      return self.wfile.write(cast(bytes, r.get(query_id)))
    from tinygrad.helpers import db_connection
    self.send_header('Content-type', 'application/json')
    conn = db_connection()
    query_params = parse_qs(urlparse(self.path).query)
    filename = query_params["filename"][0]
    cursor = conn.cursor()
    cursor.execute("select * from benchmark where filename = ? limit 1;", (filename,))
    row = cursor.fetchone()
    assert row is not None
    _, benchmarks, filename, system = row
    ret = {"benchmarks": json.loads(benchmarks), "filename": filename, "system":system}
    if filename == "llama_unjitted.txt":
      cursor.execute("select * from commits;")
      commits = [x for _,x in cursor.fetchall()]
    else: commits = []
    return self.wfile.write(json.dumps([ret, commits]).encode('utf-8'))

  def do_POST(self):
    post_data = self.rfile.read(int(self.headers["Content-Length"]))
    payload = json.loads(post_data)
    print("github webhook received!", payload["after"])
    res = requests.post("https://api.github.com/repos/qazalin/tinyfork/actions/workflows/publish_tool.yml/dispatches", headers=GH_HEADERS, data=json.dumps({"ref": "master"}))
    print(res.status_code)
    self.send_response(200)
    self.send_header("Content-Type", "application/json")
    self.end_headers()
    self.wfile.write(json.dumps({"status": "success", "message": "wh received"}).encode())

def getenv(name: str):
  assert (val:=os.getenv(name))
  return val
