class Printer(object):

	def printLine(self, line):
		print(line)

	def indent(self, key):
		self.printLine(key + ':')
		return IndentedPrinter(self)

	def indentList(self, key):
		self.printLine(key + ':')
		return ListPrinter(self)

	def startFile(self, name):
		return FilePrinter(name)

	def writeLine(self, key, value):
		self.printLine(key + ': ' + str(value))


class CompositePrinter(Printer):
	def __init__(self, printer):
		self.printer = printer

	def printLine(self, line):
		self.printer.printLine(line)

class FilePrinter(Printer):
	def __init__(self, name):
		self.printLine('START FILE: '+name)
		self.name = name

	def __enter__(self):
		return self

	def __exit__(self, a, b, c):
		self.printLine('END FILE')

class IndentedPrinter(CompositePrinter):
	indentChar = ' '
	def __init__(self, printer):
		super(IndentedPrinter, self).__init__(printer)

	def printLine(self, line):
		super(IndentedPrinter, self).printLine(self.indentChar + line)

	def __enter__(self):
		return self

	def __exit__(self, a, b, c):
		pass

class ListPrinter(CompositePrinter):
	def __init__(self, printer):
		super(ListPrinter, self).__init__(printer)

	def writeLine(self, key, value):
		raise Exception('list writer cannot')

	def indent(self, key):
		raise Exception('list writer cannot')

	def indentItem(self):
		return ListItemPrinter(self.printer)

	def __enter__(self):
		return self

	def __exit__(self, a, b, c):
		pass

class ListItemPrinter(CompositePrinter):
	def __init__(self, printer):
		super(ListItemPrinter, self).__init__(printer)
		self.hasPrintedLine = False

	def printLine(self, line):
		super(ListItemPrinter, self).printLine(('  ' if self.hasPrintedLine else '* ') + line)
		self.hasPrintedLine = True

	def __enter__(self):
		return self

	def __exit__(self, a, b, c):
		pass



