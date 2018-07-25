import csv

class Row:
	def __init__(self, csvRow): #fdsa
		self.number1 = csvRow[0]
		self.name1 = csvRow[1]
		self.number2 = csvRow[2]
		self.name2 = csvRow[3]

	def printSelf(self):
		print('name1: '+self.name1)


class RowImporter:
	def __init__(self):
		self.field = 0

	def importRow(self, row):
		row.printSelf()

importer = RowImporter()

with open('data.csv') as csvfile:
	reader = csv.reader(csvfile, delimiter=';')
	for csvRow in reader:
		importer.importRow(Row(csvRow))