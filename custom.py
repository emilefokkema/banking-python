import cat
class Positive(cat.MultipleRowCategory):

	def getCategories(self):
		return [Emile(), Fokkema()]

	def getName(self):
		return 'Positive'

	def acceptsRow(self, row):
		return row.amount >= 0

class Negative(cat.RowCategory):

	def acceptsRow(self, row):
		return row.amount < 0

	def getName(self):
		return 'Negative'

class Emile(cat.RowCategory):

	def acceptsRow(self, row):
		return row.source == 'emile'

	def getName(self):
		return 'Emile'

class Fokkema(cat.RowCategory):

	def acceptsRow(self, row):
		return row.source == 'fokkema'

	def getName(self):
		return 'Fokkema'

class TopCategory(cat.MultipleRowCategory):
	def getName(self):
		return 'Top'

	def getCategories(self):
		return [Positive(), Negative()]