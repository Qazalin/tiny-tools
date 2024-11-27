import json, requests, zipfile, io, os, redis
from typing import Dict, List, cast
from api.benchmark import TRACKED_BENCHMARKS, regex_extract_benchmark
from urllib.parse import urlparse, parse_qs
from http.server import BaseHTTPRequestHandler

# *** github settings
GH_TOKEN = os.environ["GH_TOKEN"]
GH_HEADERS = {"Authorization": f"Bearer {GH_TOKEN}", "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
BASE_URL = "https://api.github.com/repos/tinygrad/tinygrad"
# *** benchmark settings
SYSTEMS_MAP = {'Speed (AMD)': 'amd', 'Speed (AMD Training)': 'amd-train', 'Speed (NVIDIA)': 'nvidia', 'Speed (NVIDIA Training)': 'nvidia-train', 'Speed (Mac)': 'mac', 'Speed (comma)': 'comma'}
SYSTEMS = list(SYSTEMS_MAP.values())

def extract_benchmark(run) -> Dict[str, Dict[str, float]]:
  print(f"** getting data for {run['id']}")
  cache = redis.Redis(host=os.environ["REDIS_HOST"], port=6379, password=os.environ["REDIS_PASSWORD"], ssl=True)
  if (cret:=cache.get(run["id"])) is not None: return json.loads(cast(bytes, cret).decode())
  # download the artifacts
  artifacts: Dict[str, Dict[str, str]] = {}
  for artifact in requests.get(run["artifacts_url"], headers=GH_HEADERS).json()["artifacts"]:
    print(f"** downloading {artifact['name']}")
    logs: Dict[str, str] = {}
    res = requests.get(artifact["archive_download_url"], headers=GH_HEADERS)
    assert res.status_code == 200, f"Download failed: {res.status_code}"
    with io.BytesIO(res.content) as zip_content:
      with zipfile.ZipFile(zip_content, "r") as zip_ref:
        for file_name in zip_ref.namelist():
          with zip_ref.open(file_name) as file: logs[file_name] = file.read().decode("utf-8")
    artifacts[SYSTEMS_MAP[artifact["name"]]] = logs
  # extract regex...
  ret: Dict[str, Dict[str, float]] = {}
  for system,logs in artifacts.items():
    ret[system] = {}
    for file_name,log in logs.items():
      if file_name not in TRACKED_BENCHMARKS: continue
      regex, systems, skip_count, max_count = TRACKED_BENCHMARKS[file_name]
      val = regex_extract_benchmark(regex, log, skip_count, max_count)
      ret[system][file_name] = val
  cache.set(run["id"], json.dumps(ret))
  return ret

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
    self.send_header('Content-type', 'application/json')
    query_params = parse_qs(urlparse(self.path).query)
    if "filename" not in query_params: return self.wfile.write(json.dumps({"status": "ok"}).encode('utf-8'))
    filename = query_params["filename"][0]
    # ** workflow_runs (always fresh)
    runs = []
    for branch,limit in [("master", 10), ("update_benchmark", 1)]:
      res = requests.get(f"{BASE_URL}/actions/workflows/benchmark.yml/runs?branch={branch}&status=success&per_page={limit}").json()
      runs.extend(res["workflow_runs"])
    # ** extract stats (cached)
    run_stats: Dict[str, Dict[str, Dict[str, float]]] = {}
    commits: List[str] = []
    for run in sorted(runs, key=lambda x:x["run_number"]):
      run_stats[str(run["id"])] = extract_benchmark(run)
      commits.append(run["head_sha"])
    # ** ret
    if filename not in TRACKED_BENCHMARKS: return self.wfile.write(json.dumps([[], []]).encode('utf-8'))
    _, systems, _, _ = TRACKED_BENCHMARKS[filename]
    benchmarks = [[] for _ in range(len(SYSTEMS))]
    for i,(_,e) in enumerate(run_stats.items()):
      for s in systems: benchmarks[SYSTEMS.index(s)].append({"x": i, "y": e[s][filename]}) 
    ret = {"benchmarks": benchmarks, "filename": filename, "system":"_".join(sorted(systems, key=lambda x:SYSTEMS.index(x)))}
    return self.wfile.write(json.dumps([ret, commits]).encode('utf-8'))
