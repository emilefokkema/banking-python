import cat
import wholeperiod
import re
from direction import Direction

class AfBij(cat.MultipleRowCategory):
	def __init__(self, rowCheckerFactory, rowCollectionFactory, incomingOptions, outgoingOptions):
		self.af = cat.OptionableCategory(outgoingOptions, rowCheckerFactory, rowCollectionFactory)
		self.bij = cat.OptionableCategory(incomingOptions, rowCheckerFactory, rowCollectionFactory)
		super(AfBij, self).__init__()
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

	def getCategories(self):
		return [self.af, self.bij]

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
		incomingOptions = categoriesDefinition['incoming']
		outgoingOptions = categoriesDefinition['outgoing']
		self.extendDirectionOptions(incomingOptions, 'incoming')
		self.extendDirectionOptions(outgoingOptions, 'outgoing')
		self.incomingOptions = incomingOptions
		self.outgoingOptions = outgoingOptions
		self.rowCheckerFactory = rowCheckerFactory
		self.rowCollectionFactory = rowCollectionFactory
		super(TopCategory, self).__init__()

	def extendDirectionOptions(self, options, directionName):
		options['acceptRow'] = {directionName:True}
		options['categories'].append({
			'name':'leftovers',
			'rowCollection':{'displayLimit':5,'default':True}
		})

	def renewCategory(self, oldCategory):
		newCategory = AfBij(self.rowCheckerFactory, self.rowCollectionFactory, self.incomingOptions, self.outgoingOptions)
		if not oldCategory == None:
			oldCategory.end()
			newCategory.begin()
		
		return newCategory

	def getName(self):
		return 'maanden'
