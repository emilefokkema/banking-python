import cat
import wholeperiod
import rowchecker
import re
import outputrow

propcon = rowchecker.RowPropertyContainsChecker

class Pinnen(cat.CollectionCategory):
	infopattern = 'Pasvolgnr:\d+\s+(\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2})\s+Transactie:.*?Term:'

	def getName(self):
		return 'Pinnen'

	def acceptsRow(self, row):
		return not re.search(self.infopattern, row.info) == None

	def transformRow(self, row):
		match = re.search(self.infopattern, row.info)
		date = match.group(1)
		return outputrow.OutputRow(row.description, None, date, row.numberOfCents)

class OnlineBankieren(cat.CollectionCategory):
	infopattern = 'Naam:(.*?)Omschrijving:(.*?)IBAN'

	def acceptsRow(self, row):
		return not re.search(self.infopattern, row.info) == None

	def transformRow(self, row):
		match = re.search(self.infopattern, row.info)
		naam = match.group(1)
		omschrijving = match.group(2)
		return outputrow.OutputRow(naam, omschrijving, row.date, row.numberOfCents)

	def getName(self):
		return 'Online bankieren'

class Af(cat.MultipleRowCategoryWithLeftover):

	def getCategories(self):
		description = lambda r:r.description
		info = lambda r:r.info
		return [
			cat.OptionableCategory({
				'name':'Albert Heijn',
				'acceptRow':propcon(description, ['ALBERT HEIJN'])
			}),
			cat.OptionableCategory({
				'name':'Abonnementen',
				'categories':[
					{
						'name':'Netflix',
						'acceptRow':propcon(description, ['NETFLIX']),
						'expect':1
					},
					{
						'name':'NRC',
						'acceptRow':propcon(description, ['NRC']),
						'expect':1
					},
					{
						'name':'ING',
						'acceptRow':propcon(description, ['Kosten OranjePakket'])
					},
					{
						'name':'Telefoon',
						'acceptRow':propcon(description, ['T-MOBILE']),
						'expect':1
					},
					{
						'name':'Blendle',
						'acceptRow':propcon(info, ['Blendle'])
					},
					{
						'name':'Spotify',
						'acceptRow':propcon(info, ['5VL2224Q8M5JL']),
						'expect':1
					},
					{
						'name':'De Correspondent',
						'acceptRow':propcon(info, ['De Correspondent'])
					}
				]
			}),
			cat.OptionableCategory({
				'name':'NS',
				'acceptRow':propcon(description, ['NS GROEP'])
			}),
			cat.OptionableCategory({
				'name':'Zorg',
				'acceptRow':propcon(description, ['menzis', 'PEARLE'])
			}),
			cat.OptionableCategory({
				'name':'Huur',
				'acceptRow':propcon(description, ['Rijksen Beheer'])
			}),
			cat.OptionableCategory({
				'name':'Boeken',
				'acceptRow':propcon(description, ['Broese Boekverkopers','BOEKHANDEL'])
			}),
			cat.OptionableCategory({
				'name':'Belastingdienst',
				'acceptRow':propcon(description, ['Belastingdienst'])
			}),
			cat.OptionableCategory({
				'name':'CJIB',
				'acceptRow':propcon(description, ['CJIB'])
			}),
			cat.OptionableCategory({
				'name':'DUO',
				'acceptRow':propcon(description, ['DUO'])
			}),
			cat.OptionableCategory({
				'name':'Goed doel',
				'acceptRow':propcon(description, ['STG CARE'])
			}),
			cat.OptionableCategory({
				'name':'Toestelverzekering',
				'acceptRow':propcon(info, ['Toestelverzekering'])
			}),
			cat.OptionableCategory({
				'name':'Film',
				'acceptRow':propcon(info, ['Louis Hartlooper','Springhaver'])
			}),
			cat.OptionableCategory({
				'name':'Sparen',
				'acceptRow':propcon(info, ['Naar Bonusrenterekening'])
			}),
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
				cat.OptionableCategory({
					'name':'Van spaarrekening',
					'acceptRow':propcon(lambda r:r.info, ['Van Bonusrenterekening'])
				}),
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
