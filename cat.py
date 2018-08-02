class RowCategory(object):
	def __init__(self):
		self.totalCents = 0;
		self.name = self.getName()
		self.empty = True
		self.parent = None

	def addFromRowToTotal(self, row):
		self.totalCents = self.totalCents + row.numberOfCents

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

	def internalPrintSelf(self, printer):
		printer.writeLine(self.name, self.totalCents)

	def printSelf(self, printer):
		if self.totalCents == 0:
			return
		self.internalPrintSelf(printer)

class CompositeCategory(RowCategory):
	def __init__(self):
		super(CompositeCategory, self).__init__()

	def printComposite(self, printer):
		pass

	def internalPrintSelf(self, printer):
		with printer.indent(self.name) as printer1:
			self.printComposite(printer1)
			printer1.writeLine('total', self.totalCents)

class NameableCategory(RowCategory):
	def __init__(self, name):
		self._name = name
		super(NameableCategory, self).__init__()

	def getName(self):
		return self._name

class CollectionCategory(CompositeCategory):
	def __init__(self):
		super(CollectionCategory, self).__init__()
		self.rows = []

	def addRow(self, row):
		super(CollectionCategory, self).addRow(row)
		self.rows.append(row)

	def printComposite(self,printer):
		with printer.indentList('rows') as printer1:
			for row in self.rows:
				with printer1.indentItem() as printer2:
					row.printSelf(printer2)
				
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

	def printComposite(self, printer):
		super(LeftoverCategory, self).printComposite(printer)
		if self.overLimit > 0:
			printer.writeLine('more', self.overLimit)

	def getName(self):
		return 'leftovers'

class MultipleRowCategory(CompositeCategory):
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

	def printComposite(self, printer):
		for category in self.categories:
			category.printSelf(printer)

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



