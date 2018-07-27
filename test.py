import csv
import row
import custom
import printer
import clargs
import sys
import json
import jsonprinter

class RowImporter:
	def __init__(self):
		self.category = custom.TopCategory()

	def importRow(self, row):
		self.category.addRow(row)


	def printSelf(self, pr):
		self.category.printSelf(pr)

importer = RowImporter()
args = clargs.CLArguments(sys.argv)
rows = []

with open(args.csv) as csvfile:
	reader = csv.reader(csvfile, delimiter=',')
	counter = 0
	for csvRow in reader:
		if counter == 0:
			counter += 1
			continue
		rows.append(row.Row(csvRow))
		counter += 1

rows.sort(key=lambda r:r.date)

for row in rows:
	importer.importRow(row)	

importer.printSelf(printer.Printer())
if args.json:
	jp = jsonprinter.JsonPrinter()
	importer.printSelf(jp)
	with open(args.csv.replace('.csv','.json'), 'w') as jsonFile:
		json.dump(jp.getObj(), jsonFile)