import printablelist

class RowCollection:
	def __init__(self, displayLimit=-1):
		self.rows = printablelist.PrintableList([])
		self.displayLimit = displayLimit
		self.overLimit = 0

	def addRow(self, row):
		if self.displayLimit >= 0 and len(self.rows) >= self.displayLimit:
			self.overLimit += 1
		else:
			self.rows.append(row)

	def printSelf(self, printer):
		with printer.indent('items') as printer1:
			self.rows.printSelf(printer1)
		if self.overLimit > 0:
			printer.writeLine('more', self.overLimit)