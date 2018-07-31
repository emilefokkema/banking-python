import http.server
import socketserver
import json
import wholeperiod
import csvprocessor

PORT = 8000

class MyHandler(http.server.SimpleHTTPRequestHandler):
	def __init__(self, request, client_address, server):
		self.routes = [TestRoute(), CompletePeriodsRoute()]
		super(MyHandler, self).__init__(request, client_address, server)

	def do_GET(self):
		if self.path.startswith('/api'):
			self.do_api_GET()
		else:
			super(MyHandler, self).do_GET()

	def do_POST(self):
		a = self.rfile.read(int(self.headers['Content-Length'])).decode('utf-8')
		splitA = a.splitlines()
		csvprocessor.processCsv(splitA)
		self.send_response(200)
		self.send_header('Content-type','application/json')
		self.end_headers()
		self.wfile.write(b'null')

	def findRoute(self, path):
		for route in self.routes:
			if route.handles(self.path):
				return route
		return None

	def do_api_GET(self):
		route = self.findRoute(self.path)
		if route == None:
			print('no route found, sending 404')
			self.send_response(404)
			self.send_header('Content-type','application/json')
			self.end_headers()
			self.wfile.write(b'null')
			return
		self.send_response(200)
		self.send_header('Content-type','application/json')
		self.end_headers()
		output = json.dumps(route.handle(self.path))
		self.wfile.write(output.encode('utf-8'))
		return

class ApiRoute:
	pass

class TestRoute(ApiRoute):

	def handles(self, path):
		return path == '/api/test'

	def handle(self, path):
		return {"a":9}

class CompletePeriodsRoute(ApiRoute):
	def __init__(self):
		self.periodFileFinder = wholeperiod.WholePeriodHandler()

	def handles(self, path):
		return path == '/api/complete'

	def handle(self, path):
		return self.periodFileFinder.findPeriodFiles()



#Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), MyHandler) as httpd:
    print("serving at port", PORT)
    httpd.serve_forever()