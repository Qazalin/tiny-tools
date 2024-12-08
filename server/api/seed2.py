from typing import Dict, List
import os, requests, zipfile, io, json, subprocess
from tinygrad.helpers import diskcache, db_connection
from benchmark import TRACKED_BENCHMARKS, regex_extract_benchmark

# *** github settings
GH_TOKEN = os.getenv("GH_TOKEN", subprocess.getoutput("gh auth token"))
GH_HEADERS = {"Authorization": f"Bearer {GH_TOKEN}", "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
BASE_URL = "https://api.github.com/repos/tinygrad/tinygrad"
# *** benchmark settings
SYSTEMS_MAP = {'Speed (AMD)': 'amd', 'Speed (AMD Training)': 'amd-train', 'Speed (NVIDIA)': 'nvidia', 'Speed (NVIDIA Training)': 'nvidia-train', 'Speed (Mac)': 'mac', 'Speed (comma)': 'comma'}
SYSTEMS = list(SYSTEMS_MAP.values())

@diskcache
def extract_benchmark(run) -> Dict[str, Dict[str, float]]:
  print(f"** getting data for {run['id']}")
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
  return ret

Run = Dict
def get_run(run_id:str) -> Run:
  res = requests.get(f"{BASE_URL}/actions/runs/{run_id}", headers=GH_HEADERS)
  assert res.status_code == 200, f"GET failed {res.status_code} {res.json()}"
  return res.json()
def get_runs(branch:str, per_page:int) -> List[Run]:
  print(f"*** getting {per_page} runs for {branch}")
  res = requests.get(f"{BASE_URL}/actions/workflows/benchmark.yml/runs?branch={branch}&status=success&per_page={per_page}", headers=GH_HEADERS)
  assert res.status_code == 200, f"GET failed {res.status_code} {res.json()}"
  return res.json()["workflow_runs"]

# TODO: this is still bad
def append():
  ret = []
  for file in TRACKED_BENCHMARKS:
    print(f"*** extracting {file}")
    regex, systems, skip_count, max_count = TRACKED_BENCHMARKS[file]
    benchmarks = [[] for _ in range(len(SYSTEMS))]
    for system in systems:
      for i,run in enumerate(runs):
        head_sha = run["head_sha"]
        val = extract_benchmark(run)[system][file]
        benchmarks[SYSTEMS.index(system)].append({"x": i, "y": val})
    ret.append({"benchmarks": benchmarks, "filename": file, "system":"_".join(sorted(systems, key=lambda x:SYSTEMS.index(x)))})

  commits_ret = [{"sha": x["head_sha"].split("_")[1]} for x in runs]
  conn = db_connection()
  print(f"*** uploading {len(commits_ret)} commits")
  cursor = conn.cursor()
  cursor.execute("""DROP TABLE IF EXISTS benchmark""")
  cursor.execute("""DROP TABLE IF EXISTS commits""")
  cursor.execute("""CREATE TABLE benchmark ( id SERIAL PRIMARY KEY, benchmarks TEXT, filename TEXT, system TEXT)""")
  cursor.execute("""CREATE TABLE commits (id SERIAL PRIMARY KEY, sha TEXT)""")
  for item in ret: cursor.execute("INSERT INTO benchmark (benchmarks, filename, system) VALUES (?, ?, ?)", (json.dumps(item["benchmarks"]), item["filename"], item["system"]))
  for commit in commits_ret: cursor.execute("INSERT INTO commits (sha) VALUES (?)", (commit["sha"],))
  conn.commit()
  conn.close()

runs: List[Run] = []
runs += get_runs("master", 10)
runs += get_runs("update_benchmark", 1)
append()
