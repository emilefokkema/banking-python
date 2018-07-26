import cat

class DescriptionStartCategory(cat.NameableCategory):
	def __init__(self, name, descs):
		super(DescriptionStartCategory, self).__init__(name)
		self.descs = descs

	def acceptsRow(self, row):
		for desc in self.descs:
			if row.description.startswith(desc):
				return True
		return False

class InfoContainsCategory(cat.NameableCategory):
	def __init__(self, name, substr):
		super(InfoContainsCategory, self).__init__(name)
		self.substr = substr

	def acceptsRow(self, row):
		return self.substr in row.info

class Abonnementen(cat.MultipleRowCategory):
	def getCategories(self):
		return [DescriptionStartCategory('Netflix',['NETFLIX']),
				DescriptionStartCategory('NRC',['NRC']),
				DescriptionStartCategory('ING',['Kosten OranjePakket']),
				DescriptionStartCategory('Telefoon',['T-MOBILE']),
				InfoContainsCategory('Spotify','5VL2224Q8M5JL')]

	def getName(self):
		return 'Abonnementen'

class Pinnen(cat.CollectionCategory):
	def getName(self):
		return 'Pinnen'

	def acceptsRow(self, row):
		return row.description.startswith('ABN-AMRO')

class Af(cat.MultipleRowCategoryWithLeftover):

	def getCategories(self):
		return [
			DescriptionStartCategory('Albert Heijn', ['ALBERT HEIJN']),
			Abonnementen(),
			DescriptionStartCategory('NS',['NS GROEP']),
			Pinnen(),
			DescriptionStartCategory('Zorg',['Menzis','menzis', 'PEARLE']),
			DescriptionStartCategory('Huur',['Rijksen Beheer']),
			DescriptionStartCategory('Boeken',['Broese Boekverkopers','BOEKHANDEL']),
			DescriptionStartCategory('Belastingdienst',['Belastingdienst']),
			DescriptionStartCategory('CJIB',['CJIB']),
			DescriptionStartCategory('DUO',['DUO']),
			InfoContainsCategory('Toestelverzekering','Toestelverzekering')]

	def getName(self):
		return 'Af'

	def acceptsRow(self, row):
		return row.afbij == 'Af'

class Bij(cat.RowCategory):

	def acceptsRow(self, row):
		return row.afbij == 'Bij'

	def getName(self):
		return 'Bij'


class TopCategory(cat.MultipleRowCategoryWithLeftover):
	def getName(self):
		return 'Top'

	def getCategories(self):
		return [Af(), Bij()]