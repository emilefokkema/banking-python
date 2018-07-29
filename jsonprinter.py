from datetime import date
import json
class JsonPrinter(object):
	def __init__(self):
		self.object = {}

	def getObj(self):
		return self.object

	def indent(self, key):
		return JsonPropertyPrinter(self, key)

	def indentList(self, key):
		return JsonListPrinter(self, key)

	def startFile(self, fileName):
		return JsonFilePrinter(fileName)

	def writeLine(self, key, value):
		if isinstance(value, date):
			value = str(value)
		self.object[key] = value

class JsonFilePrinter(JsonPrinter):
	def __init__(self, fileName):
		super(JsonFilePrinter, self).__init__()
		self.fileName = fileName

	def __enter__(self):
		return self

	def __exit__(self, a, b, c):
		print('saving json: '+self.fileName)
		with open(self.fileName+'.json', 'w') as jsonFile:
			json.dump(self.object, jsonFile)

class CompositeJsonPrinter(JsonPrinter):
	def __init__(self, printer):
		super(CompositeJsonPrinter, self).__init__()
		self.printer = printer

class JsonPropertyPrinter(CompositeJsonPrinter):
	def __init__(self, printer, key):
		super(JsonPropertyPrinter, self).__init__(printer)
		self.key = key

	def __enter__(self):
		return self

	def __exit__(self, a, b, c):
		self.printer.writeLine(self.key, self.object)

class JsonListPrinter(JsonPropertyPrinter):
	def __init__(self, printer, key):
		super(JsonListPrinter, self).__init__(printer, key)
		self.object = []

	def addValue(self, obj):
		self.object.append(obj)

	def indentItem(self):
		return JsonListItemPrinter(self)

	def writeLine(self, key, value):
		raise Exception('list writer cannot')

	def indent(self, key):
		raise Exception('list writer cannot')

class JsonListItemPrinter(CompositeJsonPrinter):
	def __init__(self, printer):
		super(JsonListItemPrinter, self).__init__(printer)

	def __enter__(self):
		return self

	def __exit__(self, a, b, c):
		self.printer.addValue(self.object)
