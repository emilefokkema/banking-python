from datetime import date
import json
import random
class JsonPrinter(object):
	def __init__(self):
		self.object = {}
		self.hasExited = False

	def getObj(self):
		return self.object

	def indent(self, key):
		return JsonPropertyPrinter(self, key)

	def indentList(self, key):
		return JsonListPrinter(self, key)

	def startFile(self, fileName):
		return JsonFilePrinter(fileName)

	def sanitizeValue(self, value):
		if isinstance(value, date):
			return str(value)
		return value

	def writeLine(self, key, value):
		self.object[key] = self.sanitizeValue(value)

	def doexit(self):
		pass

	def __enter__(self):
		return self

	def __exit__(self, a, b, c):
		if self.hasExited:
			return
		self.hasExited = True
		self.doexit()

class JsonFilePrinter(JsonPrinter):
	def __init__(self, fileName):
		super(JsonFilePrinter, self).__init__()
		self.fileName = fileName

	def doexit(self):
		print('saving json: '+self.fileName)
		with open(self.fileName+'.json', 'w') as jsonFile:
			json.dump(self.object, jsonFile)

class CompositeJsonPrinter(JsonPrinter):
	def __init__(self, printer):
		super(CompositeJsonPrinter, self).__init__()
		self.printer = printer
		self.lineWritten = False

	def printToParent(self):
		pass

	def writeLine(self, key, value):
		super(CompositeJsonPrinter, self).writeLine(key, value)
		self.lineWritten = True

	def doexit(self):
		if self.lineWritten:
			self.printToParent()

class JsonPropertyPrinter(CompositeJsonPrinter):
	def __init__(self, printer, key):
		super(JsonPropertyPrinter, self).__init__(printer)
		self.key = key

	def printToParent(self):
		self.printer.writeLine(self.key, self.object)

class JsonListPrinter(JsonPropertyPrinter):
	def __init__(self, printer, key):
		super(JsonListPrinter, self).__init__(printer, key)
		self.object = []

	def addValue(self, obj):
		self.object.append(self.sanitizeValue(obj))

	def indentItem(self):
		return JsonListItemPrinter(self)

	def writeLine(self, key, value):
		raise Exception('list writer cannot')

	def indent(self, key):
		raise Exception('list writer cannot')

	def doexit(self):
		self.printToParent()

class JsonListItemPrinter(CompositeJsonPrinter):

	def printToParent(self):
		self.printer.addValue(self.object)

