class Printer:
	indentChar = ' '

	def __init__(self):
		self.indentAmount = 0
		self.lines = []

	def indent(self):
		self.indentAmount += 1

	def unindent(self):
		self.indentAmount -= 1

	def writeLine(self, line):
		self.lines.append(self.indentAmount * self.indentChar + line)

	def printSelf(self):
		print('\n'.join(self.lines))
