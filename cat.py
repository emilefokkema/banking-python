class RowCategory(object):
	def __init__(self):
		self.total = 0;
		self.name = self.getName()
		self.empty = True
		self.parent = None

	def addFromRowToTotal(self, row):
		self.total = self.total + row.amount

	def addRow(self, row):
		self.addFromRowToTotal(row)
		self.empty = False

	def isRecursivelyEmpty(self):
		return self.empty and (self.parent == None or self.parent.isRecursivelyEmpty())

	def setParent(self, parent):
		self.parent = parent

	def acceptsRow(self, row):
		return True

	def canAddRow(self, row):
		return self.acceptsRow(row);

	def acceptsRowInDuplicate(self, row):
		return False

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

	def printSelf(self,printer):
		if len(self.rows) == 0:
			return
		with printer.indent(self.name) as printer1:
			with printer1.indentList('rows') as printer2:
				for row in self.rows:
					with printer2.indentItem() as printer3:
						row.printSelf(printer3)
					
			printer1.writeLine('total', self.total)

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
			category.setParent(self)

	def canAddRow(self, row):
		if not self.acceptsRow(row):
			return False
		for category in self.categories:
			if category.canAddRow(row):
				return True
		return False

	def acceptsRowInDuplicate(self, row):
		if not self.acceptsRow(row):
			return False
		for category in self.categories:
			if category.acceptsRowInDuplicate(row):
				return True
		return False

	def getName(self):
		return 'Multiple category'

	def getCategories(self):
		return []

	def addRow(self, row):
		super(MultipleRowCategory, self).addRow(row)
		for category in self.categories:
			if category.canAddRow(row):
				category.addRow(row)
				return

	def printSelf(self, printer):
		with printer.indent(self.name) as printer1:
			for category in self.categories:
				category.printSelf(printer1)
			printer1.writeLine('total', self.total)

	def addCategory(self, cat):
		self.categories.append(cat)

class MultipleRowCategoryWithLeftover(MultipleRowCategory):
	def __init__(self):
		super(MultipleRowCategoryWithLeftover, self).__init__()
		self.addCategory(LeftoverCategory())


class RepeatingCategory(RowCategory):
	def __init__(self):
		super(RepeatingCategory, self).__init__()
		currentCategory = self.renewCategory(None)
		self.currentCategory = currentCategory
		self.categories = [currentCategory]

	def renewCategory(self, oldCategory):
		return RowCategory()

	def canAddRow(self, row):
		return self.currentCategory.canAddRow(row) or self.currentCategory.acceptsRowInDuplicate(row)

	def addRow(self, row):
		if self.currentCategory.acceptsRowInDuplicate(row):
			self.currentCategory = self.renewCategory(self.currentCategory)
			self.categories.append(self.currentCategory)

		self.currentCategory.addRow(row)

	def printSelf(self, printer):
		with printer.indentList(self.name) as printer1:
			for category in self.categories:
				with printer1.indentItem() as printer2:
					category.printSelf(printer2)



