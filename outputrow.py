class OutputRow:
	def __init__(self, name, description, date, amount):
		self.name = name
		self.description = description
		self.date = date
		self.amount = amount

	def printSelf(self, printer):
		printer.writeLine('name', self.name)
		printer.writeLine('description', self.description)
		printer.writeLine('date', self.date)
		printer.writeLine('amount', self.amount)