import cat
class DescriptionStartCategory(cat.RowCategory):
	def __init__(self, name, descs):
		self._name = name
		super(DescriptionStartCategory, self).__init__()
		self.descs = descs

	def acceptsRow(self, row):
		for desc in self.descs:
			if row.description.startswith(desc):
				return True
		return False

	def getName(self):
		return self._name

class Af(cat.MultipleRowCategory):

	def getCategories(self):
		return [
			DescriptionStartCategory('Albert Heijn', ['ALBERT HEIJN']),
			DescriptionStartCategory('Abonnementen',['NETFLIX','NRC','Kosten OranjePakket','T-MOBILE']),
			DescriptionStartCategory('NS',['NS GROEP']),
			DescriptionStartCategory('ABN-AMRO',['ABN-AMRO']),
			DescriptionStartCategory('Zorg',['Menzis','menzis', 'PEARLE']),
			DescriptionStartCategory('Huur',['Rijksen Beheer']),
			DescriptionStartCategory('Boeken',['Broese Boekverkopers']),
			DescriptionStartCategory('Belastingdienst',['Belastingdienst']),
			DescriptionStartCategory('CJIB',['CJIB']),
			DescriptionStartCategory('DUO',['DUO'])]

	def getName(self):
		return 'Af'

	def acceptsRow(self, row):
		return row.afbij == 'Af'

class Bij(cat.RowCategory):

	def acceptsRow(self, row):
		return row.afbij == 'Bij'

	def getName(self):
		return 'Bij'


class TopCategory(cat.MultipleRowCategory):
	def getName(self):
		return 'Top'

	def getCategories(self):
		return [Af(), Bij()]