import http.server
import socketserver

PORT = 8000

class MyHandler(http.server.SimpleHTTPRequestHandler):
	def __init__(self, request, client_address, server):
		super(MyHandler, self).__init__(request, client_address, server)

	def do_GET():
		if self.path.startswith('/api'):
			self.do_api_GET()
		else:
			super(MyHandler, self).do_GET()

	def do_api_GET(self):
		self.send_response(200)
		self.send_header('Content-type','text/html')
		self.end_headers()
		self.wfile.write("ada") #Doesnt work
		return

#Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), MyHandler) as httpd:
    print("serving at port", PORT)
    httpd.serve_forever()