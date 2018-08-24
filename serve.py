import http.server
import socketserver
import json
from csvprocessor import CsvProcessor
import jsonprinter
from dataprovider import DataProvider
from periodhistory import PeriodHistory
import os

PORT = 8000

class MyHandler(http.server.SimpleHTTPRequestHandler):
	def __init__(self, request, client_address, server):
		self.routes = [CompletePeriodsRoute(), PostCsvRoute(), DeleteJsonRoute()]
		super(MyHandler, self).__init__(request, client_address, server)

	def do_GET(self):
		if self.path.startswith('/api'):
			self.do_api_GET()
		else:
			super(MyHandler, self).do_GET()

	def do_POST(self):
		route = self.findRoute(self.path, 'POST')
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
		data = self.rfile.read(int(self.headers['Content-Length'])).decode('utf-8')
		output = json.dumps(route.handle(data))
		self.wfile.write(output.encode('utf-8'))
		return

	def findRoute(self, path, method):
		for route in self.routes:
			if route.method == method and route.handles(path):
				return route
		return None

	def do_api_GET(self):
		route = self.findRoute(self.path, 'GET')
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
	def __init__(self):
		self.dataProvider = DataProvider()
		self.history = PeriodHistory(self.dataProvider)

class ApiGetRoute(ApiRoute):
	def __init__(self):
		super(ApiGetRoute, self).__init__()
		self.method = 'GET'

class ApiPostRoute(ApiRoute):
	def __init__(self):
		super(ApiPostRoute, self).__init__()
		self.method = 'POST'

class PostCsvRoute(ApiPostRoute):
	def __init__(self):
		super(PostCsvRoute, self).__init__()

	def handles(self, path):
		return path == '/api/csv'

	def handle(self, data):
		return CsvProcessor(self.dataProvider, self.history).processCsv(data.splitlines())

class DeleteJsonRoute(ApiPostRoute):
	def __init__(self):
		super(DeleteJsonRoute, self).__init__()

	def handles(self, path):
		return path == '/api/delete'

	def handle(self, data):
		self.history.removeItem(data)
		return 'OK'

class CompletePeriodsRoute(ApiGetRoute):
	def __init__(self):
		super(CompletePeriodsRoute, self).__init__()

	def handles(self, path):
		return path == '/api/complete'

	def handle(self, path):
		return self.history.getAll()

with socketserver.TCPServer(("", PORT), MyHandler) as httpd:
    print("serving at port", PORT)
    httpd.serve_forever()