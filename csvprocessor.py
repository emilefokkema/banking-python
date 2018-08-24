import csv
from rowfactory import RowFactory
import custom
from rowcheckerfactory import RowCheckerFactory
from rowcollection import RowCollectionFactory

class RowImporter:
	def __init__(self, rowCheckerFactory, rowCollectionFactory, categoriesDefinition):
		self.category = custom.TopCategory(rowCheckerFactory, rowCollectionFactory, categoriesDefinition)

	def importRow(self, row):
		self.category.addRow(row)


	def printSelf(self, pr):
		self.category.printSelf(pr)

def processCsv(csvfile, rowDefinition, categoriesDefinition, printer):
	rows = []
	rowFactory = RowFactory(rowDefinition)
	rowCollectionFactory = RowCollectionFactory(rowFactory)
	rowCheckerFactory = RowCheckerFactory(rowFactory)
	importer = RowImporter(rowCheckerFactory, rowCollectionFactory, categoriesDefinition)

	reader = csv.reader(csvfile, delimiter=',')
	counter = 0
	for csvRow in reader:
		if counter == 0:
			counter += 1
			continue
		rows.append(rowFactory.createRow(csvRow))
		counter += 1

	rows.sort(key=lambda r:r['date'])

	for row1 in rows:
		importer.importRow(row1)	

	importer.printSelf(printer)