import csv

class Row:
	def __init__(self, csvRow): #fdsa
		self.amount = int(csvRow[0])
		self.source = csvRow[1]

	def printSelf(self):
		return 'source: '+self.source

class RowCategory(object):
	def __init__(self):
		self.total = 0;
		self.name = self.getName()

	def addFromRowToTotal(self, row):
		self.total = self.total + row.amount

	def addRow(self, row):
		self.addFromRowToTotal(row)

	def getName(self):
		return 'category'

	def getPrefix(self, indent):
		return indent * ' '

	def getTotalString(self):
		return 'Total: '+str(self.total)

	def printSelf(self, indent):
		return self.getPrefix(indent) + self.name + '. '+self.getTotalString()

class LeftoverCategory(RowCategory):
	def __init__(self):
		super(LeftoverCategory, self).__init__()
		self.rows = []

	def addRow(self, row):
		super(LeftoverCategory, self).addRow(row)
		self.rows.append(row)

	def acceptsRow(self, row):
		return True

	def printSelf(self,indent):
		if len(self.rows) > 0:
			return self.getPrefix(indent) + 'some leftovers'
		return ''

class MultipleRowCategory(RowCategory):
	def __init__(self):
		super(MultipleRowCategory, self).__init__()
		self.categories = []
		for category in self.getCategories():
			self.addCategory(category)
		self.addCategory(LeftoverCategory())

	def acceptsRow(self, row):
		return True;

	def getName(self):
		return 'Multiple category'

	def getCategories(self):
		return []

	def addRow(self, row):
		self.addFromRowToTotal(row)
		for category in self.categories:
			if category.acceptsRow(row):
				category.addRow(row)
				return


	def printSelf(self, indent):
		prefix = self.getPrefix(indent)
		result = prefix + self.name + '\n'
		for category in self.categories:
			result = result + prefix + category.printSelf(2)+'\n'
		result = result + prefix + self.getTotalString()
		return result

	def addCategory(self, cat):
		self.categories.append(cat)


class Positive(MultipleRowCategory):

	def getCategories(self):
		return [Emile(), Fokkema()]

	def getName(self):
		return 'Positive'

	def acceptsRow(self, row):
		return row.amount >= 0

class Negative(RowCategory):

	def acceptsRow(self, row):
		return row.amount < 0

	def getName(self):
		return 'Negative'

class Emile(RowCategory):

	def acceptsRow(self, row):
		return row.source == 'emile'

	def getName(self):
		return 'Emile'

class Fokkema(RowCategory):

	def acceptsRow(self, row):
		return row.source == 'fokkema'

	def getName(self):
		return 'Fokkema'

class TopCategory(MultipleRowCategory):
	def getName(self):
		return 'Top'

	def getCategories(self):
		return [Positive(), Negative()]

class RowImporter:
	def __init__(self):
		self.category = TopCategory()

	def importRow(self, row):
		if self.category.acceptsRow(row):
			self.category.addRow(row)
		else:
			print('unable to categorize row: '+row.printSelf())


	def printSelf(self):
		print(self.category.printSelf(0))

importer = RowImporter()

with open('data.csv') as csvfile:
	reader = csv.reader(csvfile, delimiter=';')
	for csvRow in reader:
		importer.importRow(Row(csvRow))

importer.printSelf()