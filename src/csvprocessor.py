import csv
from src.custom import TopCategory
from src.jsonprinter import printJson
from src.printablelist import PrintableList

class PeriodFile:
	def __init__(self, period):
		self.period = period

	def printSelf(self, printer):
		printer.writeLine('fileName', self.period.makeFileName())
		with printer.indent('file') as printer1:
			self.period.printSelf(printer1)

class CsvProcessor:
	def __init__(self, rowFactory, rowCheckerFactory, rowCollectionFactory, categoriesConfiguration, history, ignoreFirst):
		self.rowFactory = rowFactory
		self.rowCollectionFactory = rowCollectionFactory
		self.rowCheckerFactory = rowCheckerFactory
		self.categoriesConfiguration = categoriesConfiguration
		self.ignoreFirst = ignoreFirst
		self.history = history

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

		complete = importer.getComplete()
		incomplete = importer.getIncomplete()

		for c in complete:
			self.history.addItem(c)

		return printJson(PrintableList([PeriodFile(period) for period in incomplete + complete]))