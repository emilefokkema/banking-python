from datetime import date
def getDate(str):
	year = int(str[0:4])
	month = int(str[4:6])
	day = int(str[6:8])
	return date(year, month, day)

class Row:
	def __init__(self, csvRow): #fdsa
		self.afbij = csvRow[5]
		self.numberOfCents = int(csvRow[6].replace(',',''))
		self.description = csvRow[1]
		self.info = csvRow[8]
		self.date = getDate(csvRow[0])

	def printSelf(self, printer):
		printer.writeLine('amount', self.numberOfCents)
		printer.writeLine('date', self.date)
		printer.writeLine('description', self.description)