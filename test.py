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
		self.category.addRow(row)


	def printSelf(self, pr):
		self.category.printSelf(pr)

importer = RowImporter()
args = clargs.CLArguments(sys.argv)

with open(args.csv) as csvfile:
	reader = csv.reader(csvfile, delimiter=',')
	counter = 0
	for csvRow in reader:
		if counter == 0:
			counter += 1
			continue
		importer.importRow(row.Row(csvRow))
		counter += 1
		

importer.printSelf(printer.Printer())