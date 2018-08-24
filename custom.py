import cat
from printablelist import PrintableList
import re
from direction import Direction

def getExtendedCategoriesDefinition(categoriesDefinition):
	incomingOptions = categoriesDefinition['incoming']
	outgoingOptions = categoriesDefinition['outgoing']
	return {
		'categories':[
			{
				'name':outgoingOptions['name'],
				'acceptRow': {'outgoing':True},
				'categories':outgoingOptions['categories'] + [{'name':'leftovers','rowCollection':{'displayLimit':5,'default':True}}]
			},
			{
				'name':incomingOptions['name'],
				'acceptRow':{'incoming':True},
				'categories':incomingOptions['categories'] + [{'name':'leftovers','rowCollection':{'displayLimit':5,'default':True}}]
			}
		]
	}

class AfBij(cat.OptionableCategory):
	def __init__(self, options, rowCheckerFactory, rowCollectionFactory):
		super(AfBij, self).__init__(options, rowCheckerFactory, rowCollectionFactory)
		self.af = self.categories[0]
		self.bij = self.categories[1]
		self.first = None
		self.last = None
		self.hasBeginning = False
		self.hasEnd = False

	def addRow(self, row):
		super(AfBij, self).addRow(row)
		if self.first == None:
			self.first = row
		self.last = row

	def begin(self):
		self.hasBeginning = True

	def isComplete(self):
		return self.hasBeginning and self.hasEnd

	def end(self):
		self.hasEnd = True

	def makeFileName(self):
		return self.first['date'].strftime(r'%Y-%m-%d')+self.last['date'].strftime(r'%Y-%m-%d')

	def printSelf(self, printer):
		with printer.indent('Af') as printer1:
			self.af.printSelf(printer1)
		with printer.indent('Bij') as printer1:
			self.bij.printSelf(printer1)
		printer.writeLine('from',self.first['date'])
		printer.writeLine('through',self.last['date'])
		printer.writeLine('hasBeginning', self.hasBeginning)
		printer.writeLine('hasEnd', self.hasEnd)

class PeriodFile:
	def __init__(self, period):
		self.period = period

	def printSelf(self, printer):
		printer.writeLine('fileName', self.period.makeFileName())
		with printer.indent('file') as printer1:
			self.period.printSelf(printer1)

class TopCategory:
	def __init__(self, rowCheckerFactory, rowCollectionFactory, categoriesDefinition):
		self.categoriesDefinition = getExtendedCategoriesDefinition(categoriesDefinition)
		self.rowCheckerFactory = rowCheckerFactory
		self.rowCollectionFactory = rowCollectionFactory
		currentCategory = self.getNewPeriod()
		self.currentCategory = currentCategory
		self.categories = PrintableList([currentCategory])

	def getNewPeriod(self):
		return AfBij(self.categoriesDefinition, self.rowCheckerFactory, self.rowCollectionFactory)

	def renewCategory(self):
		self.currentCategory.end()
		newCategory = self.getNewPeriod()
		newCategory.begin()
		self.currentCategory = newCategory
		self.categories.append(self.currentCategory)

	def getComplete(self):
		return PrintableList([PeriodFile(cat) for cat in self.categories if cat.isComplete()])

	def getIncomplete(self):
		return PrintableList([PeriodFile(cat) for cat in self.categories if not cat.isComplete()])

	def addRow(self, row):
		if self.currentCategory.acceptsRowInDuplicate(row):
			self.renewCategory()

		self.currentCategory.addRow(row)

	def printSelf(self, printer):
		self.categories.printSelf(printer)