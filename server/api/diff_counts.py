from typing import Dict
import requests, subprocess, os, io, zipfile
from tinygrad.helpers import diskcache

# *** github settings
GH_TOKEN = subprocess.getoutput("gh auth token")
BASE_URL = f"https://api.github.com/repos/{os.getenv('GITHUB_REPOSITORY', 'tinygrad/tinygrad')}"
GH_HEADERS = {"Authorization": f"Bearer {GH_TOKEN}", "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}

@diskcache
def download_logs(run) -> Dict[str, Dict[str, str]]:
  print(f"**** run = {run['id']}")
  ret: Dict[str, Dict[str, str]] = {}
  artifacts = requests.get(run["artifacts_url"], headers=GH_HEADERS).json()["artifacts"]
  for artifact in artifacts:
    print(f"** downloading {artifact['name']}")
    ret[artifact["name"]] = {}
    res = requests.get(artifact["archive_download_url"], headers=GH_HEADERS)
    assert res.status_code == 200, f"Download failed: {res.status_code}"
    with io.BytesIO(res.content) as zip_content:
      with zipfile.ZipFile(zip_content, "r") as zip_ref:
        for file_name in zip_ref.namelist():
          with zip_ref.open(file_name) as file: ret[artifact["name"]][file_name] =  file.read().decode("utf-8")
  assert len(ret) == len(artifacts), f"incomplete download {len(ret)} {len(artifacts)}"
  return ret

def get_logs(run_id:str) -> Dict[str, Dict[str, str]]:
  res = requests.get(f"{BASE_URL}/actions/runs/{run_id}", headers=GH_HEADERS)
  assert res.status_code == 200, f"GET failed {res.status_code} {res.json()}"
  return download_logs(res.json())

def get_counts(alllogs):
  counts: Dict[str, Dict[str, int]] = {}
  for system, logs in alllogs.items():
    counts[system] = {}
    for job,log in logs.items():
      cnt = [int(x.split("=")[1]) for x in log.splitlines() if x.startswith("ScheduleItem_CNT")]
      counts[system][job] = sum(cnt)
  return counts

good_logs = get_counts(get_logs("12097224212"))
compare_logs = get_counts(get_logs("12097346471"))
for system, jobs in good_logs.items():
  for j,v in jobs.items():
    if compare_logs[system][j] != v:
      print(v, compare_logs[system][j], j, system)

