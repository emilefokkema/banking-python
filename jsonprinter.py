from datetime import date
import json
import random
class JsonPrinter(object):
	def __init__(self, doexit = None):
		self.object = {}
		self.hasExited = False
		if doexit == None:
			doexit = lambda obj,written:0
		self.doexit = doexit
		self.written = False

	def getObj(self):
		return self.object

	def indent(self, key):
		return JsonPrinter(lambda obj,written:self.writeLine(key,obj) if written else 0)

	def indentList(self, key):
		return JsonListPrinter(lambda obj,written:self.writeLine(key,obj))

	def writeToFile(self, obj, fileName):
		print('saving json: '+fileName)
		with open(fileName+'.json', 'w') as jsonFile:
			json.dump(obj, jsonFile)

	def startFile(self, fileName):
		return JsonPrinter(lambda obj,written:self.writeToFile(obj, fileName))

	def sanitizeValue(self, value):
		if isinstance(value, date):
			return str(value)
		return value

	def writeLine(self, key, value):
		self.object[key] = self.sanitizeValue(value)
		self.written = True

	def __enter__(self):
		return self

	def __exit__(self, a, b, c):
		if self.hasExited:
			return
		self.hasExited = True
		self.doexit(self.object, self.written)

class JsonListPrinter(JsonPrinter):
	def __init__(self, doexit = None):
		super(JsonListPrinter, self).__init__(doexit)
		self.object = []

	def addValue(self, obj):
		self.object.append(self.sanitizeValue(obj))

	def indentItem(self):
		return JsonPrinter(lambda obj,written:self.addValue(obj) if written else 0)

	def writeLine(self, key, value):
		raise Exception('list writer cannot')

	def indent(self, key):
		raise Exception('list writer cannot')

