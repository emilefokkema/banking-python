import expectation
import outputrow
import printablelist
import rowcollection
import rowchecker

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


class OptionableCategory(RowCategory):
	def __init__(self, options):
		self._name = options['name']
		super(OptionableCategory, self).__init__()
		self.categories = printablelist.PrintableList([])
		self.hasCategories = False
		if 'categories' in options:
			self.hasCategories = True
			for categoryOptions in options['categories']:
				newCategory = OptionableCategory(categoryOptions)
				self.categories.append(newCategory)
				newCategory.setParent(self)
		if 'acceptRow' in options:
			self.rowChecker = options['acceptRow']
		else:
			self.rowChecker = rowchecker.AcceptingRowChecker()
		if 'expect' in options:
			self.expectation = expectation.RowNumberExpectation(options['expect'])

	def canAddRow(self, row):
		if not self.rowChecker.checkRow(row):
			return False
		if not self.hasCategories:
			return True
		for category in self.categories:
			if category.canAddRow(row):
				return True
		return False

	def addRow(self, row):
		super(OptionableCategory, self).addRow(row)
		if self.hasCategories:
			for category in self.categories:
				if category.canAddRow(row):
					category.addRow(row)
					return

	def internalPrintSelf(self, printer):
		super(OptionableCategory, self).internalPrintSelf(printer)
		if self.hasCategories:
			with printer.indent('categories') as printer1:
				self.categories.printSelf(printer1)

	def getName(self):
		return self._name

class CollectionCategory(RowCategory):
	def __init__(self):
		super(CollectionCategory, self).__init__()
		self.rows = rowcollection.RowCollection()

	def addRow(self, row):
		super(CollectionCategory, self).addRow(row)
		self.rows.addRow(self.transformRow(row))

	def transformRow(self, row):
		description = row.getDescription()
		return outputrow.OutputRow(description, row.date, row.numberOfCents)

	def internalPrintSelf(self,printer):
		super(CollectionCategory, self).internalPrintSelf(printer)
		with printer.indent('rows') as printer1:
			self.rows.printSelf(printer1)
				
class LeftoverCategory(CollectionCategory):
	def __init__(self):
		super(LeftoverCategory, self).__init__()
		self.rows = rowcollection.RowCollection(5)

	def getName(self):
		return 'leftovers'

class MultipleRowCategory(RowCategory):
	def __init__(self):
		super(MultipleRowCategory, self).__init__()
		self.categories = printablelist.PrintableList([])
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
		with printer.indent('categories') as printer1:
			self.categories.printSelf(printer1)

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
		self.categories = printablelist.PrintableList([currentCategory])

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
		self.categories.printSelf(printer)