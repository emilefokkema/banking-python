import http.server
import socketserver
import json
import wholeperiod
import csvprocessor
import jsonprinter
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
	pass

class ApiGetRoute(ApiRoute):
	def __init__(self):
		self.method = 'GET'

class ApiPostRoute(ApiRoute):
	def __init__(self):
		self.method = 'POST'

class PostCsvRoute(ApiPostRoute):
	def __init__(self):
		super(PostCsvRoute, self).__init__()

	def handles(self, path):
		return path == '/api/csv'

	def getRowDefinition(self):
		with open('row-definition.json','r') as rowdefinitionfile:
			return json.load(rowdefinitionfile)

	def getCategoriesDefinition(self):
		with open('categories.json','r') as categoriesdefinitionfile:
			return json.load(categoriesdefinitionfile)

	def handle(self, data):
		splitA = data.splitlines()
		printer = jsonprinter.JsonPrinter()
		rowdefinition = self.getRowDefinition()
		categoriesDefinition = self.getCategoriesDefinition()
		csvprocessor.processCsv(splitA, rowdefinition, categoriesDefinition, printer)
		return printer.getObj()

class DeleteJsonRoute(ApiPostRoute):
	def handles(self, path):
		return path == '/api/delete'

	def handle(self, data):
		if os.path.exists(data):
			os.remove(data)
		return 'OK'

class CompletePeriodsRoute(ApiGetRoute):
	def __init__(self):
		super(CompletePeriodsRoute, self).__init__()
		self.periodFileFinder = wholeperiod.WholePeriodHandler()

	def handles(self, path):
		return path == '/api/complete'

	def handle(self, path):
		return self.periodFileFinder.findPeriodFiles()

with socketserver.TCPServer(("", PORT), MyHandler) as httpd:
    print("serving at port", PORT)
    httpd.serve_forever()