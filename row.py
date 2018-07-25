class Row:
	def __init__(self, csvRow): #fdsa
		self.afbij = csvRow[5]
		self.amount = float(csvRow[6].replace(',','.'))
		self.description = csvRow[1]

	def printSelf(self, printer):
		printer.writeLine(self.description)