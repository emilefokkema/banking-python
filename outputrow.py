class OutputRow:
	def __init__(self, description, date, amount):
		self.description = description
		self.date = date
		self.amount = amount

	def printSelf(self, printer):
		printer.writeLine('description', self.description)
		printer.writeLine('date', self.date)
		printer.writeLine('amount', self.amount)