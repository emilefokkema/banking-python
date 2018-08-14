class RowNumberExpectation:
	def __init__(self, expectedNumber):
		self.expectedNumber = expectedNumber
		self.dates = []

	def addRow(self, row):
		self.dates.append(row.date)

	def printSelf(self, printer):
		actualNumber = len(self.dates)
		if not actualNumber == self.expectedNumber:
			printer.writeLine('expected',self.expectedNumber)
			printer.writeLine('actual', actualNumber)
			with printer.indent('dates') as printer1:
				with printer1.startList() as printer2:
					for date in self.dates:
						printer2.addValue(date)