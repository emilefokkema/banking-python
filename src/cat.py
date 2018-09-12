from src.expectation import RowNumberExpectation
from src.printablelist import PrintableList
from src.rowcollection import RowCollection

class RowCategory(object):
	def __init__(self, name='name'):
		self.totalCents = 0;
		self.name = name
		self.empty = True
		self.parent = None
		self.expectation = None

	def addRow(self, row):
		self.totalCents = self.totalCents + row['amount']
		if not self.expectation == None:
			self.expectation.addRow(row)
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


class OptionableCategory(RowCategory):
	def __init__(self, options, rowCheckerFactory, rowCollectionFactory):
		super(OptionableCategory, self).__init__(options['name'] if 'name' in options else 'name')
		self.categories = PrintableList([])
		self.hasCategories = False
		self.rowCollection = None
		self.collectsRows = False
		if 'rowCollection' in options:
			self.collectsRows = True
			self.rowCollection = rowCollectionFactory.getDefault(options['rowCollection'])
		if 'categories' in options:
			self.hasCategories = True
			for categoryOptions in options['categories']:
				newCategory = OptionableCategory(categoryOptions, rowCheckerFactory, rowCollectionFactory)
				self.categories.append(newCategory)
				newCategory.setParent(self)
		self.rowChecker = rowCheckerFactory.getRowChecker(options['acceptRow'] if 'acceptRow' in options else None)
		if 'expect' in options:
			self.expectation = RowNumberExpectation(options['expect'])

		self.oncePerPeriod = (options['oncePerPeriod'] == True) if 'oncePerPeriod' in options else False

	def canAddRow(self, row):
		if not self.rowChecker.checkRow(row):
			return False
		if not self.hasCategories:
			return True
		for category in self.categories:
			if category.canAddRow(row):
				return True
		return False

	def acceptsRowInDuplicate(self, row):
		if not self.rowChecker.checkRow(row):
			return False
		if not self.hasCategories:
			return self.oncePerPeriod and not self.isRecursivelyEmpty()
		for category in self.categories:
			if category.acceptsRowInDuplicate(row):
				return True
		return False

	def addRow(self, row):
		super(OptionableCategory, self).addRow(row)
		if self.hasCategories:
			for category in self.categories:
				if category.canAddRow(row):
					category.addRow(row)
					break
		if self.collectsRows:
			self.rowCollection.addRow(row)

	def internalPrintSelf(self, printer):
		super(OptionableCategory, self).internalPrintSelf(printer)
		if self.hasCategories:
			with printer.indent('categories') as printer1:
				self.categories.printSelf(printer1)
		if self.collectsRows:
			with printer.indent('rows') as printer1:
				self.rowCollection.printSelf(printer1)
