import csv

class Row:
	def __init__(self, csvRow): #fdsa
		self.amount = int(csvRow[0])
		self.source = csvRow[1]

	def printSelf(self):
		return 'name1: '+self.name1

class RowCategory(object):
	def __init__(self):
		self.total = 0;

	def addFromRowToTotal(self, row):
		self.total = self.total + row.amount

	def addRow(self, row):
		self.addFromRowToTotal(row)

	def printSelf(self):
		return self.name + '. Total: '+str(self.total)

class MultipleRowCategory(RowCategory):
	def __init__(self):
		super(MultipleRowCategory, self).__init__()
		self.categories = []
		self.name = 'Multiple category'

	def selfAcceptsRow(self, row):
		return True

	def acceptsRow(self, row):
		if not self.selfAcceptsRow(row):
			return False
		for category in self.categories:
			if category.acceptsRow(row):
				return True
		return False

	def addRow(self, row):
		self.addFromRowToTotal(row)
		for category in self.categories:
			if category.acceptsRow(row):
				category.addRow(row)
				break


	def printSelf(self):
		result = self.name + '\n'
		for category in self.categories:
			result = result + "    "+category.printSelf()+'\n'
		result = result + 'Total: '+str(self.total)
		return result

	def addCategory(self, cat):
		self.categories.append(cat)


class Positive(MultipleRowCategory):
	def __init__(self):
		super(Positive, self).__init__()
		self.name = 'Positive'
		self.addCategory(Emile())
		self.addCategory(Fokkema())

	def selfAcceptsRow(self, row):
		return row.amount >= 0

class Negative(RowCategory):
	def __init__(self):
		super(Negative, self).__init__()
		self.name = 'Negative'

	def acceptsRow(self, row):
		return row.amount < 0

class Emile(RowCategory):
	def __init__(self):
		super(Emile, self).__init__()
		self.name = 'Emile'

	def acceptsRow(self, row):
		return row.source == 'emile'

class Fokkema(RowCategory):
	def __init__(self):
		super(Fokkema, self).__init__()
		self.name = 'Fokkema'

	def acceptsRow(self, row):
		return row.source == 'fokkema'

class RowImporter:
	def __init__(self):
		self.category = MultipleRowCategory()
		self.category.addCategory(Positive())
		self.category.addCategory(Negative())

	def importRow(self, row):
		if self.category.acceptsRow(row):
			self.category.addRow(row)
		else:
			print('unable to categorize row: '+row.printSelf())


	def printSelf(self):
		print(self.category.printSelf())

importer = RowImporter()

with open('data.csv') as csvfile:
	reader = csv.reader(csvfile, delimiter=';')
	for csvRow in reader:
		importer.importRow(Row(csvRow))

importer.printSelf()