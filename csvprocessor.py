import csv

import custom

import jsonprinter
from domainexception import DomainException

class CsvProcessor:
	def __init__(self, rowFactory, rowCheckerFactory, rowCollectionFactory, categoriesConfiguration, history, ignoreFirst):
		self.rowFactory = rowFactory
		self.rowCollectionFactory = rowCollectionFactory
		self.rowCheckerFactory = rowCheckerFactory
		self.categoriesConfiguration = categoriesConfiguration
		self.ignoreFirst = ignoreFirst
		self.history = history

	def getPrintedList(self, printableList):
		printer = jsonprinter.JsonPrinter()
		printableList.printSelf(printer)
		return printer.getObj()

	def processCsv(self, csvfile):
		rows = []
		importer = custom.TopCategory(self.rowCheckerFactory, self.rowCollectionFactory, self.categoriesConfiguration)

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