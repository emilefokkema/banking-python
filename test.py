import csv
import row
import custom
import printer
import clargs
import sys

class RowImporter:
	def __init__(self):
		self.category = custom.TopCategory()

	def importRow(self, row):
		if self.category.acceptsRow(row):
			self.category.addRow(row)
		else:
			print('unable to categorize row: '+row.printSelf())


	def printSelf(self, pr):
		self.category.printSelf(pr)
		pr.printSelf()

importer = RowImporter()
args = clargs.CLArguments(sys.argv)

with open(args.csv) as csvfile:
	reader = csv.reader(csvfile, delimiter=';')
	for csvRow in reader:
		importer.importRow(row.Row(csvRow))

importer.printSelf(printer.Printer())