import json
import plotly.express as px
from tinygrad.helpers import db_connection

conn = db_connection()
cur = conn.cursor()
filename = "llama_unjitted.txt"
row = cur.execute("select * from benchmark where filename = ? limit 1;", (filename,)).fetchone()
_, benchmarks, filename, system = row
ret = {"benchmarks": json.loads(benchmarks), "filename": filename, "system":system}
if filename == "llama_unjitted.txt":
  print(ret)
cur.execute("select * from commits;")
commits = [x for _,x in cur.fetchall()]
