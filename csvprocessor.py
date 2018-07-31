import csv
import row
import custom

class RowImporter:
	def __init__(self):
		self.category = custom.TopCategory()

	def importRow(self, row):
		self.category.addRow(row)


	def printSelf(self, pr):
		self.category.printSelf(pr)

def processCsv(csvfile, printer):
	importer = RowImporter()
	rows = []


	reader = csv.reader(csvfile, delimiter=',')
	counter = 0
	for csvRow in reader:
		if counter == 0:
			counter += 1
			continue
		rows.append(row.Row(csvRow))
		counter += 1

	rows.sort(key=lambda r:r.date)

	for row1 in rows:
		importer.importRow(row1)	

	importer.printSelf(printer)