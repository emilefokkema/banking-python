import csv
from src.custom import TopCategory

from src.jsonprinter import JsonPrinter
from src.domainexception import DomainException

class CsvProcessor:
	def __init__(self, rowFactory, rowCheckerFactory, rowCollectionFactory, categoriesConfiguration, history, ignoreFirst):
		self.rowFactory = rowFactory
		self.rowCollectionFactory = rowCollectionFactory
		self.rowCheckerFactory = rowCheckerFactory
		self.categoriesConfiguration = categoriesConfiguration
		self.ignoreFirst = ignoreFirst
		self.history = history

	def getPrintedList(self, printableList):
		printer = JsonPrinter()
		printableList.printSelf(printer)
		return printer.getObj()

	def getSkippingReader(self, iterable):
		counter = 0
		for x in iterable:
			counter += 1
			if counter == 1 and self.ignoreFirst:
				continue
			yield x


	def processCsv(self, csvfile):
		reader = csv.reader(csvfile, delimiter=',')
		rows = [self.rowFactory.createRow(csvRow) for csvRow in self.getSkippingReader(reader)]
		days = set(map(lambda row:row['date'], rows))
		rowsByDay = [(day, [row for row in rows if row['date'] == day]) for day in days]
		rowsByDay.sort(key=lambda rd:rd[0])

		importer = TopCategory(self.rowCheckerFactory, self.rowCollectionFactory, self.categoriesConfiguration)
			
		

		for dayRows in rowsByDay:
			importer.addDayRows(dayRows[1])

		complete = self.getPrintedList(importer.getComplete())
		incomplete = self.getPrintedList(importer.getIncomplete())

		for c in complete:
			self.history.addItem(c['fileName'], c['file'])

		return incomplete + complete