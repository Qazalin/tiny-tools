from http.server import HTTPServer
from server.api.index import handler

server_address = ('', 8000)
httpd = HTTPServer(server_address, handler)

print("Serving at port 8000")
httpd.serve_forever()
