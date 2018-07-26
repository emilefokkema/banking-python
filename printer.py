class Printer:
	indentChar = ' '

	def __init__(self):
		self.indentAmount = 0

	def getPrefix(self):
		return self.indentAmount * self.indentChar

	def indent(self, key):
		print(self.getPrefix() + key + ':')
		self.indentAmount += 1
		return PrinterIndentation(self)

	def unindent(self):
		self.indentAmount -= 1

	def writeLine(self, key, value):
		print(self.getPrefix() + key + ': ' + str(value))

class PrinterIndentation:
	def __init__(self, printer):
		self.printer = printer

	def __enter__(self):
		pass

	def __exit__(self, a, b, c):
		self.printer.unindent()

