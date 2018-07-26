class Printer:
	indentChar = ' '

	def __init__(self):
		self.indentAmount = 0
		self.lines = []

	def indent(self):
		self.indentAmount += 1

	def unindent(self):
		self.indentAmount -= 1

	def writeLine(self, key, value):
		self.lines.append(self.indentAmount * self.indentChar + key + ': ' + str(value))

	def printSelf(self):
		print('\n'.join(self.lines))
