import cat
import wholeperiod
import re

class DescriptionStartCategory(cat.NameableCategory):
	def __init__(self, name, descs):
		super(DescriptionStartCategory, self).__init__(name)
		self.descs = descs

	def acceptsRow(self, row):
		rowlower = row.description.lower()
		for desc in self.descs:
			if rowlower.startswith(desc.lower()):
				return True
		return False

class InfoContainsCategory(cat.NameableCategory):
	def __init__(self, name, substrs):
		super(InfoContainsCategory, self).__init__(name)
		self.substrs = substrs

	def acceptsRow(self, row):
		rowlower = row.info.lower()
		for sub in self.substrs:
			if sub.lower() in rowlower:
				return True
		return False

class Abonnementen(cat.MultipleRowCategory):
	def getCategories(self):
		return [DescriptionStartCategory('Netflix',['NETFLIX']),
				DescriptionStartCategory('NRC',['NRC']),
				DescriptionStartCategory('ING',['Kosten OranjePakket']),
				DescriptionStartCategory('Telefoon',['T-MOBILE']),
				InfoContainsCategory('Blendle',['Blendle']),
				InfoContainsCategory('Spotify',['5VL2224Q8M5JL']),
				InfoContainsCategory('De Correspondent',['De Correspondent'])]

	def getName(self):
		return 'Abonnementen'

class Pinnen(cat.CollectionCategory):
	def getName(self):
		return 'Pinnen'

	def acceptsRow(self, row):
		return row.description.startswith('ABN-AMRO')

class OnlineBankierenTransaction:
	def __init__(self, naam, omschrijving, date, amount):
		self.naam = naam
		self.omschrijving = omschrijving
		self.date = date
		self.amount = amount

	def printSelf(self, printer):
		printer.writeLine('naam',self.naam)
		printer.writeLine('omschrijving', self.omschrijving)
		printer.writeLine('date', self.date)
		printer.writeLine('amount', self.amount)

class OnlineBankieren(cat.CompositeCategory):
	infopattern = 'Naam:(.*?)Omschrijving:(.*?)IBAN'

	def __init__(self):
		super(OnlineBankieren, self).__init__()
		self.obtransactions = []

	def acceptsRow(self, row):
		return row.soort == 'Online bankieren' and not re.search(self.infopattern, row.info) == None

	def addRow(self, row):
		super(OnlineBankieren, self).addRow(row)
		match = re.search(self.infopattern, row.info)
		naam = match.group(1)
		omschrijving = match.group(2)
		self.obtransactions.append(OnlineBankierenTransaction(naam, omschrijving, row.date, row.numberOfCents))

	def printComposite(self, printer):
		with printer.indentList('transactions') as printer1:
			for obtransaction in self.obtransactions:
				with printer1.indentItem() as printer2:
					obtransaction.printSelf(printer2)

	def getName(self):
		return 'Online bankieren'

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
			DescriptionStartCategory('Goed doel',['STG CARE']),
			InfoContainsCategory('Toestelverzekering',['Toestelverzekering']),
			InfoContainsCategory('Film',['Louis Hartlooper','Springhaver']),
			InfoContainsCategory('Sparen',['Naar Bonusrenterekening']),
			OnlineBankieren()]

	def getName(self):
		return 'Af'

	def acceptsRow(self, row):
		return row.afbij == 'Af'

class Salaris(cat.RowCategory):

	def acceptsRow(self, row):
		return row.description.startswith('T-MOBILE')

	def acceptsRowInDuplicate(self, row):
		return not self.isRecursivelyEmpty() and row.description.startswith('T-MOBILE')

	def getName(self):
		return 'Salaris'


class Bij(cat.MultipleRowCategoryWithLeftover):
	def getCategories(self):
		return [Salaris(),
				DescriptionStartCategory('Van spaarrekening',['E C Fokkema'])]

	def acceptsRow(self, row):
		return row.afbij == 'Bij'

	def getName(self):
		return 'Bij'


class AfBij(cat.MultipleRowCategoryWithLeftover):
	def __init__(self):
		super(AfBij, self).__init__()
		self.printHandler = wholeperiod.WholePeriodHandler()
		self.first = None
		self.last = None
		self.hasBeginning = False
		self.hasEnd = False

	def addRow(self, row):
		super(AfBij, self).addRow(row)
		if self.first == None:
			self.first = row
		self.last = row

	def begin(self):
		self.hasBeginning = True

	def end(self):
		self.hasEnd = True

	def getCategories(self):
		return [Af(), Bij()]

	def printSelf(self, printer):
		with self.printHandler.getAfBijPrinter(self, printer) as printer1:
			for category in self.categories:
				category.printSelf(printer1)
			printer1.writeLine('from',self.first.date)
			printer1.writeLine('through',self.last.date)
			printer1.writeLine('hasBeginning', self.hasBeginning)
			printer1.writeLine('hasEnd', self.hasEnd)

class TopCategory(cat.RepeatingCategory):
	def __init__(self):
		super(TopCategory, self).__init__()

	def renewCategory(self, oldCategory):
		newCategory = AfBij()
		if not oldCategory == None:
			oldCategory.end()
			newCategory.begin()
		
		return newCategory

	def getName(self):
		return 'maanden'
