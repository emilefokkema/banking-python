import cat
import wholeperiod
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
		self.printHandler = wholeperiod.WholePeriodHandler()
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

	def end(self):
		self.hasEnd = True

	def printSelf(self, printer):
		with self.printHandler.getAfBijPrinter(self, printer) as printer1:
			with printer1.indent('Af') as printer2:
				self.af.printSelf(printer2)
			with printer1.indent('Bij') as printer2:
				self.bij.printSelf(printer2)
			printer1.writeLine('from',self.first['date'])
			printer1.writeLine('through',self.last['date'])
			printer1.writeLine('hasBeginning', self.hasBeginning)
			printer1.writeLine('hasEnd', self.hasEnd)

class TopCategory(cat.RepeatingCategory):
	def __init__(self, rowCheckerFactory, rowCollectionFactory, categoriesDefinition):
		self.categoriesDefinition = getExtendedCategoriesDefinition(categoriesDefinition)
		self.rowCheckerFactory = rowCheckerFactory
		self.rowCollectionFactory = rowCollectionFactory
		super(TopCategory, self).__init__()

	def renewCategory(self, oldCategory):
		newCategory = AfBij(self.categoriesDefinition, self.rowCheckerFactory, self.rowCollectionFactory)
		if not oldCategory == None:
			oldCategory.end()
			newCategory.begin()
		
		return newCategory

	def getName(self):
		return 'maanden'
