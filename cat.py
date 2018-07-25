class RowCategory(object):
	def __init__(self):
		self.total = 0;
		self.name = self.getName()

	def addFromRowToTotal(self, row):
		self.total = self.total + row.amount

	def addRow(self, row):
		self.addFromRowToTotal(row)

	def getName(self):
		return 'category'

	def getTotalString(self):
		return 'Total: '+str(self.total)

	def printSelf(self, printer):
		printer.writeLine(self.name + '. '+self.getTotalString())

class LeftoverCategory(RowCategory):
	def __init__(self):
		super(LeftoverCategory, self).__init__()
		self.rows = []

	def addRow(self, row):
		super(LeftoverCategory, self).addRow(row)
		self.rows.append(row)

	def acceptsRow(self, row):
		return True

	def printSelf(self,printer):
		if len(self.rows) > 0:
			printer.writeLine('some leftovers:')
			printer.indent()
			for row in self.rows:
				row.printSelf(printer)
			printer.unindent()

class MultipleRowCategory(RowCategory):
	def __init__(self):
		super(MultipleRowCategory, self).__init__()
		self.categories = []
		for category in self.getCategories():
			self.addCategory(category)
		self.addCategory(LeftoverCategory())

	def acceptsRow(self, row):
		return True;

	def getName(self):
		return 'Multiple category'

	def getCategories(self):
		return []

	def addRow(self, row):
		self.addFromRowToTotal(row)
		for category in self.categories:
			if category.acceptsRow(row):
				category.addRow(row)
				return


	def printSelf(self, printer):
		printer.writeLine(self.name)
		printer.indent()
		for category in self.categories:
			category.printSelf(printer)
		printer.unindent()
		printer.writeLine(self.getTotalString())

	def addCategory(self, cat):
		self.categories.append(cat)
