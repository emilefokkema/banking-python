from datetime import datetime
from enum import Enum

class PrintableDict:
	def __init__(self, d):
		self.dict = d

	def printSelf(self, printer):
		printer._useObj(self.dict)

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

	def _useObj(self, o):
		self.written = any(p for p in o)
		self.object = o

	def indent(self, key):
		return JsonPrinter(lambda obj,written:self.endIndent(key, obj, written))

	def endIndent(self, key, obj, written):
		if written:
			self.writeLine(key, obj)

	def startList(self):
		return JsonListPrinter(lambda obj,written:self.endList(obj))

	def endList(self, obj):
		self.written = True
		self.object = obj

	def writeLine(self, key, value):
		self.object[key] = value
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
		self.object.append(obj)

	def indentItem(self):
		return JsonPrinter(lambda obj,written:self.addValue(obj) if written else 0)

	def writeLine(self, key, value):
		raise Exception('list writer cannot')

	def indent(self, key):
		raise Exception('list writer cannot')

def printJson(printable):
	printer = JsonPrinter()
	printable.printSelf(printer)
	return printer.getObj()