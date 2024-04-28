import asyncio, websockets, os
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

FP = "/Users/qazal/code/tinygrad/tinygrad/schedule.pkl"
clients = set()
class GraphChangeHandler(FileSystemEventHandler):
  def on_modified(self, event):
    if event.src_path == FP: asyncio.run(reload_graph())

async def reload_graph():
  with open(FP, "rb") as f: data = f.read()
  asyncio.gather(*[client.send(data) for client in clients])
  print("sent graph")

async def ws_handler(websocket):
  clients.add(websocket)
  try: await websocket.wait_closed()
  finally: clients.remove(websocket)

async def main():
  observer = Observer()
  observer.schedule(GraphChangeHandler(), path=os.path.dirname(FP), recursive=False)
  observer.start()
  try:
    server = await websockets.serve(ws_handler, "localhost", 8765)
    await server.wait_closed()
  finally:
    observer.stop()
    observer.join()

asyncio.run(main())
