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

	def printSelf(self, printer):
		if self.total == 0:
			return
		printer.writeLine(self.name, self.total)

class NameableCategory(RowCategory):
	def __init__(self, name):
		self._name = name
		super(NameableCategory, self).__init__()

	def getName(self):
		return self._name

class CollectionCategory(RowCategory):
	def __init__(self):
		super(CollectionCategory, self).__init__()
		self.rows = []

	def addRow(self, row):
		super(CollectionCategory, self).addRow(row)
		self.rows.append(row)

	def acceptsRow(self, row):
		return True

	def printSelf(self,printer):
		super(CollectionCategory, self).printSelf(printer)
		if len(self.rows) > 0:
			printer.indent()
			for row in self.rows:
				row.printSelf(printer)
			printer.unindent()

class LeftoverCategory(CollectionCategory):
	displayLimit = 30

	def __init__(self):
		super(LeftoverCategory, self).__init__()
		self.overLimit = 0

	def addRow(self, row):
		if len(self.rows) < self.displayLimit:
			super(LeftoverCategory, self).addRow(row)
		else:
			self.overLimit += 1
			self.addFromRowToTotal(row)

	def printSelf(self, printer):
		super(LeftoverCategory, self).printSelf(printer)
		if self.overLimit > 0:
			printer.writeLine('more', self.overLimit)

	def getName(self):
		return 'leftovers'

class MultipleRowCategory(RowCategory):
	def __init__(self):
		super(MultipleRowCategory, self).__init__()
		self.categories = []
		for category in self.getCategories():
			self.addCategory(category)

	def acceptsRow(self, row):
		for category in self.categories:
			if category.acceptsRow(row):
				return True
		return False

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
		printer.writeLine(self.name, self.total)
		printer.indent()
		for category in self.categories:
			category.printSelf(printer)
		printer.unindent()

	def addCategory(self, cat):
		self.categories.append(cat)

class MultipleRowCategoryWithLeftover(MultipleRowCategory):
	def __init__(self):
		super(MultipleRowCategoryWithLeftover, self).__init__()
		self.addCategory(LeftoverCategory())

	def acceptsRow(self, row):
		return True;
