import csv
from rowfactory import RowFactory
import custom
from rowcheckerfactory import RowCheckerFactory
from rowcollection import RowCollectionFactory
import jsonprinter
from domainexception import DomainException

class CsvProcessor:
	def __init__(self, dataProvider, history):
		try:
			rowDefinition = dataProvider.getItem('row-definition')
		except FileNotFoundError:
			raise DomainException('Please provide a row definition before processing a csv')
		
		self.rowFactory = RowFactory(rowDefinition)
		self.rowCollectionFactory = RowCollectionFactory(self.rowFactory)
		self.rowCheckerFactory = RowCheckerFactory(self.rowFactory)
		try:
			self.categoriesDefinition = dataProvider.getItem('categories')
		except FileNotFoundError:
			raise DomainException('Please provide categories before processing a csv')

		self.dataProvider = dataProvider
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
			if counter == 0:
				counter += 1
				continue
			rows.append(self.rowFactory.createRow(csvRow))
			counter += 1

		rows.sort(key=lambda r:r['date'])

		for row1 in rows:
			importer.addRow(row1)

		complete = self.getPrintedList(importer.getComplete())
		incomplete = self.getPrintedList(importer.getIncomplete())

		for c in complete:
			self.history.addItem(c['fileName'], c['file'])

		return incomplete