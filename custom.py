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
		return [DescriptionStartCategory('Netflix',['NETFLIX']).expect(1),
				DescriptionStartCategory('NRC',['NRC']).expect(1),
				DescriptionStartCategory('ING',['Kosten OranjePakket']),
				DescriptionStartCategory('Telefoon',['T-MOBILE']).expect(1),
				InfoContainsCategory('Blendle',['Blendle']),
				InfoContainsCategory('Spotify',['5VL2224Q8M5JL']).expect(1),
				InfoContainsCategory('De Correspondent',['De Correspondent'])]

	def getName(self):
		return 'Abonnementen'

class PinnenTransaction:
	def __init__(self, name, date, amount):
		self.name = name
		self.date = date
		self.amount = amount

	def printSelf(self, printer):
		printer.writeLine('naam', self.name)
		printer.writeLine('date', self.date)
		printer.writeLine('amount', self.amount)

class Pinnen(cat.CollectionCategory):
	infopattern = 'Pasvolgnr:\d+\s+(\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2})\s+Transactie:.*?Term:'

	def getName(self):
		return 'Pinnen'

	def acceptsRow(self, row):
		return not re.search(self.infopattern, row.info) == None

	def transformRow(self, row):
		match = re.search(self.infopattern, row.info)
		date = match.group(1)
		return PinnenTransaction(row.description, date, row.numberOfCents)

	def getCollectionName(self):
		return 'pinnenTransactions'

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

class OnlineBankieren(cat.CollectionCategory):
	infopattern = 'Naam:(.*?)Omschrijving:(.*?)IBAN'

	def acceptsRow(self, row):
		return not re.search(self.infopattern, row.info) == None

	def transformRow(self, row):
		match = re.search(self.infopattern, row.info)
		naam = match.group(1)
		omschrijving = match.group(2)
		return OnlineBankierenTransaction(naam, omschrijving, row.date, row.numberOfCents)

	def getCollectionName(self):
		return 'transactions'

	def getName(self):
		return 'Online bankieren'

class Af(cat.MultipleRowCategoryWithLeftover):

	def getCategories(self):
		return [
			DescriptionStartCategory('Albert Heijn', ['ALBERT HEIJN']),
			Abonnementen(),
			DescriptionStartCategory('NS',['NS GROEP']),
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
			Pinnen(),
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
				DescriptionStartCategory('Van spaarrekening',['E C Fokkema']),
				OnlineBankieren()]

	def acceptsRow(self, row):
		return row.afbij == 'Bij'

	def getName(self):
		return 'Bij'


class AfBij(cat.MultipleRowCategory):
	def __init__(self):
		self.af = Af()
		self.bij = Bij()
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
		return [self.af, self.bij]

	def printSelf(self, printer):
		with self.printHandler.getAfBijPrinter(self, printer) as printer1:
			with printer1.indent('Af') as printer2:
				self.af.printSelf(printer2)
			with printer1.indent('Bij') as printer2:
				self.bij.printSelf(printer2)
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
