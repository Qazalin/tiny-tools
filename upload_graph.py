import redis, datetime, json, zlib
from server.api.index import getenv

r = redis.Redis(host=getenv("REDIS_HOST"), port=6379, password=getenv("REDIS_PASSWORD"), ssl=True)
id = int(datetime.datetime.now().timestamp())
dump = json.dumps(json.load(open("/tmp/graph.json")))
r.set(str(id), zlib.compress(dump.encode("utf-8")))
print(id)
