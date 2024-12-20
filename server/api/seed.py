import os, requests, zipfile, io, glob, json, subprocess
from benchmark import TRACKED_BENCHMARKS, regex_extract_benchmark
from tinygrad.helpers import db_connection

# *** github settings
GH_TOKEN = os.getenv("GH_TOKEN", subprocess.getoutput("gh auth token"))
BASE_URL = f"https://api.github.com/repos/{os.getenv('GITHUB_REPOSITORY', 'tinygrad/tinygrad')}"
GH_HEADERS = {"Authorization": f"Bearer {GH_TOKEN}", "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}

# *** benchmark settings
SYSTEMS_MAP = {'Speed (AMD)': 'amd', 'Speed (AMD Training)': 'amd-train', 'Speed (NVIDIA)': 'nvidia', 'Speed (NVIDIA Training)': 'nvidia-train', 'Speed (Mac)': 'mac', 'Speed (comma)': 'comma'}
SYSTEMS = list(SYSTEMS_MAP.values())

def get_artifacts(run):
  artifacts = requests.get(run["artifacts_url"], headers=GH_HEADERS).json()["artifacts"]
  for artifact in artifacts:
    res = requests.get(artifact["archive_download_url"], headers=GH_HEADERS)
    assert res.status_code == 200, f"download failed {res.status_code}"
    with io.BytesIO(res.content) as zip_content:
      with zipfile.ZipFile(zip_content, "r") as zip_ref: zip_ref.extractall(f"/tmp/benchmarks/{run['run_number']}_{run['head_sha']}/{SYSTEMS_MAP[artifact['name']]}")

def get_run(run_id:str):
  res = requests.get(f"{BASE_URL}/actions/runs/{run_id}", headers=GH_HEADERS)
  assert res.status_code == 200, f"GET failed {res.status_code} {res.json()}"
  get_artifacts(res.json())

def get_runs(branch:str, per_page:int):
  print(f"*** getting {per_page} runs for {branch}")
  res = requests.get(f"{BASE_URL}/actions/workflows/benchmark.yml/runs?branch={branch}&status=success&per_page={per_page}", headers=GH_HEADERS)
  assert res.status_code == 200, f"GET failed {res.status_code} {res.json()}"
  runs = res.json()["workflow_runs"]
  for run in runs:
    print(run["id"])
    get_artifacts(run)

def append():
  files = list(sorted(list(glob.glob(f"/tmp/benchmarks/*")), key=lambda f:int(f.split("/")[-1].split("_")[0])))
  commits = [f.split("/")[-1] for f in files]
  ret = []
  for file in TRACKED_BENCHMARKS:
    print(f"*** extracting {file}")
    regex, systems, skip_count, max_count = TRACKED_BENCHMARKS[file]
    benchmarks = [[] for _ in range(len(SYSTEMS))]
    for system in systems:
      runs = sorted(glob.glob(f"/tmp/benchmarks/**/{system}/{file}"), key=lambda f:int(f.split("/")[-3].split("_")[0]))
      for run in runs:
        head_sha = run.split("/")[-3]
        with open(run) as f: logs = f.read()
        val = regex_extract_benchmark(regex, logs, skip_count, max_count)
        benchmarks[SYSTEMS.index(system)].append({"x": commits.index(head_sha), "y": val})
    ret.append({"benchmarks": benchmarks, "filename": file, "system":"_".join(sorted(systems, key=lambda x:SYSTEMS.index(x)))})

  commits_ret = [{"sha": x.split("_")[1]} for x in commits]
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

try: os.rmdir("/tmp/benchmarks")
except: pass
get_runs("master", 10)
get_runs("update_benchmark", 1)
append()
