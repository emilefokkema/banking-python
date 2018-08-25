import http.server
import socketserver
import json
from csvprocessor import CsvProcessor
import jsonprinter
from dataprovider import DataProvider
from periodhistory import PeriodHistory
import traceback
from domainexception import DomainException
from configuration import Configuration

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

	def no_route_found(self):
		print('no route found, sending 404')
		self.sendCode(404)
		self.return_json(None)

	def sendCode(self, code):
		self.send_response(code)
		self.send_header('Content-type','application/json')
		self.end_headers()

	def return_json(self, obj):
		self.wfile.write(json.dumps(obj).encode('utf-8'))

	def do_POST(self):
		route = self.findRoute(self.path, 'POST')
		if route == None:
			return self.no_route_found()
		try:
			data = self.rfile.read(int(self.headers['Content-Length'])).decode('utf-8')
			result = route.handle(data)
			self.sendCode(200)
			return self.return_json(result)
		except DomainException as d:
			self.sendCode(500)
			return self.return_json(d.message)
		except Exception as e:
			traceback.print_exc()
			self.sendCode(500)
			return self.return_json(None)

	def findRoute(self, path, method):
		for route in self.routes:
			if route.method == method and route.handles(path):
				return route
		return None

	def do_api_GET(self):
		route = self.findRoute(self.path, 'GET')
		if route == None:
			return self.no_route_found()
		self.sendCode(200)
		return self.return_json(route.handle(self.path))

class ApiRoute:
	def __init__(self):
		self.dataProvider = DataProvider()
		self.history = PeriodHistory(self.dataProvider)
		self.configuration = Configuration(self.dataProvider)

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
		return CsvProcessor(self.configuration, self.history).processCsv(data.splitlines())

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