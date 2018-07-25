class Row:
	def __init__(self, csvRow): #fdsa
		self.amount = int(csvRow[0])
		self.source = csvRow[1]

	def printSelf(self, printer):
		printer.writeLine('source: '+self.source)