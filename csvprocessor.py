import csv
from rowfactory import RowFactory
import custom
from rowcheckerfactory import RowCheckerFactory
from rowcollection import RowCollectionFactory
import jsonprinter
from domainexception import DomainException

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

class CsvProcessor:
	def __init__(self, configuration, history):
		rowDefinition = configuration['rowDefinition']
		self.rowFactory = RowFactory(rowDefinition)
		self.rowCollectionFactory = RowCollectionFactory(self.rowFactory)
		self.rowCheckerFactory = RowCheckerFactory(self.rowFactory)
		self.categoriesDefinition = getExtendedCategoriesDefinition(configuration['categories'])
		self.ignoreFirst = configuration['ignoreFirstLine'] if 'ignoreFirstLine' in configuration else False
		self.history = history

	def getPrintedList(self, printableList):
		printer = jsonprinter.JsonPrinter()
		printableList.printSelf(printer)
		return printer.getObj()

	def processCsv(self, csvfile):
		rows = []
		importer = custom.TopCategory(self.rowCheckerFactory, self.rowCollectionFactory, self.categoriesDefinition)

		reader = csv.reader(csvfile, delimiter=',')
		counter = 0
		for csvRow in reader:
			counter += 1
			if counter == 1 and self.ignoreFirst:
				continue
			rows.append(self.rowFactory.createRow(csvRow))
			

		rows.sort(key=lambda r:r['date'])

		for row1 in rows:
			importer.addRow(row1)

		complete = self.getPrintedList(importer.getComplete())
		incomplete = self.getPrintedList(importer.getIncomplete())

		for c in complete:
			self.history.addItem(c['fileName'], c['file'])

		return incomplete