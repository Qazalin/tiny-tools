from typing import Dict
import requests, subprocess, os, io, zipfile, difflib
from tinygrad.helpers import diskcache, colored

# *** github settings
GH_TOKEN = subprocess.getoutput("gh auth token")
BASE_URL = f"https://api.github.com/repos/{os.getenv('GITHUB_REPOSITORY', 'tinygrad/tinygrad')}"
GH_HEADERS = {"Authorization": f"Bearer {GH_TOKEN}", "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}

@diskcache
def download_log(run, target_file:str) -> Dict[str, str]:
  print(f"**** run = {run['id']}")
  ret: Dict[str, str] = {}
  artifacts = requests.get(run["artifacts_url"], headers=GH_HEADERS).json()["artifacts"]
  for artifact in artifacts:
    print(f"** downloading {artifact['name']}")
    res = requests.get(artifact["archive_download_url"], headers=GH_HEADERS)
    assert res.status_code == 200, f"Download failed: {res.status_code}"
    with io.BytesIO(res.content) as zip_content:
      with zipfile.ZipFile(zip_content, "r") as zip_ref:
        for file_name in zip_ref.namelist():
          if file_name == target_file:
            with zip_ref.open(file_name) as file: ret[artifact["name"]] = file.read().decode("utf-8")
  assert len(ret) == len(artifacts), f"incomplete download {len(ret)} {len(artifacts)}"
  return ret

def get_schedule(run_id:str) -> Dict[str, str]:
  res = requests.get(f"{BASE_URL}/actions/runs/{run_id}", headers=GH_HEADERS)
  assert res.status_code == 200, f"GET failed {res.status_code} {res.json()}"
  return download_log(res.json(), "schedule.txt")

def print_diff(s0, s1):
  lines = list(difflib.unified_diff(str(s0).splitlines(), str(s1).splitlines()))
  diff = ""
  for line in lines:
    if "/Users/tiny/" in line: diff += "\n"+line
    if line.startswith("+"): diff += colored("\n"+line, "green")
    elif line.startswith("-"): diff += colored("\n"+line, "red") 
    else: continue
  print(diff)

good_logs = get_schedule("12071189038")
compare_logs = get_schedule("12071593051")
for i, (gk, good) in enumerate(good_logs.items()):
  try: assert good == compare_logs[gk]
  except AssertionError as e:
    print_diff(good, compare_logs[gk])
    raise e
