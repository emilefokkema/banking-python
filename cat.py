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
			with printer.indentList('dates') as printer1:
				for date in self.dates:
					printer1.addValue(date)

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


class RowCategory(object):
	def __init__(self):
		self.totalCents = 0;
		self.name = self.getName()
		self.empty = True
		self.parent = None
		self.expectation = None

	def addRow(self, row):
		self.totalCents = self.totalCents + row.numberOfCents
		if not self.expectation == None:
			self.expectation.addRow(row)
		self.empty = False

	def expect(self, numberOfRows):
		self.expectation = RowNumberExpectation(numberOfRows)
		return self

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
		printer.writeLine('name',self.name)
		printer.writeLine('total', self.totalCents)
		if not self.expectation == None:
			with printer.indent('expectation') as printer1:
				self.expectation.printSelf(printer1)

	def printSelf(self, printer):
		if self.totalCents == 0:
			return
		self.internalPrintSelf(printer)


class NameableCategory(RowCategory):
	def __init__(self, name, rowChecker):
		self._name = name
		super(NameableCategory, self).__init__()
		self.rowChecker = rowChecker

	def acceptsRow(self, row):
		return self.rowChecker.checkRow(row)

	def getName(self):
		return self._name

class CollectionCategory(RowCategory):
	def __init__(self):
		super(CollectionCategory, self).__init__()
		self.rows = []

	def addRowToList(self, row):
		self.rows.append(row)

	def addRow(self, row):
		super(CollectionCategory, self).addRow(row)
		self.addRowToList(self.transformRow(row))

	def transformRow(self, row):
		return OutputRow(row.description, row.info, row.date, row.numberOfCents)

	def internalPrintSelf(self,printer):
		super(CollectionCategory, self).internalPrintSelf(printer)
		with printer.indentList('rows') as printer1:
			for row in self.rows:
				with printer1.indentItem() as printer2:
					row.printSelf(printer2)
				
class LeftoverCategory(CollectionCategory):
	displayLimit = 5

	def __init__(self):
		super(LeftoverCategory, self).__init__()
		self.overLimit = 0

	def addRowToList(self, row):
		if len(self.rows) < self.displayLimit:
			self.rows.append(row)
		else:
			self.overLimit += 1

	def internalPrintSelf(self, printer):
		super(LeftoverCategory, self).internalPrintSelf(printer)
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

	def internalPrintSelf(self, printer):
		super(MultipleRowCategory, self).internalPrintSelf(printer)
		with printer.indentList('categories') as printer1:
			for category in self.categories:
				with printer1.indentItem() as printer2:
					category.printSelf(printer2)

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



