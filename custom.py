import cat
import wholeperiod
import re
import outputrow
from direction import Direction

class Pinnen(cat.CollectionCategory):
	infopattern = r'Pasvolgnr:\d+\s+(\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2})\s+Transactie:.*?Term:'

	def getName(self):
		return 'Pinnen'

	def acceptsRow(self, row):
		return not re.search(self.infopattern, row.additional['info']) == None

	def transformRow(self, row):
		match = re.search(self.infopattern, row.additional['info'])
		date = match.group(1)
		return outputrow.OutputRow(row.additional['description'], date, row.numberOfCents)

class OnlineBankieren(cat.CollectionCategory):
	infopattern = 'Naam:(.*?)Omschrijving:(.*?)IBAN'

	def acceptsRow(self, row):
		return not re.search(self.infopattern, row.additional['info']) == None

	def transformRow(self, row):
		match = re.search(self.infopattern, row.additional['info'])
		naam = match.group(1)
		omschrijving = match.group(2)
		return outputrow.OutputRow(naam + ' ' + omschrijving, row.date, row.numberOfCents)

	def getName(self):
		return 'Online bankieren'

class Af(cat.MultipleRowCategoryWithLeftover):
	def __init__(self, rowCheckerFactory):
		self.rowCheckerFactory = rowCheckerFactory
		super(Af, self).__init__()

	def getCategories(self):
		return [
			cat.OptionableCategory({
				'name':'Albert Heijn',
				'acceptRow':{
					'propertyContains':{
						'name':'description',
						'values':['ALBERT HEIJN']
					}
				}
			}, self.rowCheckerFactory),
			cat.OptionableCategory({
				'name':'Abonnementen',
				'categories':[
					{
						'name':'Netflix',
						'acceptRow':{
							'propertyContains':{
								'name':'description',
								'values':['NETFLIX']
							}
						},
						'expect':1
					},
					{
						'name':'NRC',
						'acceptRow':{
							'propertyContains':{
								'name':'description',
								'values':['NRC']
							}
						},
						'expect':1
					},
					{
						'name':'ING',
						'acceptRow':{
							'propertyContains':{
								'name':'description',
								'values':['Kosten OranjePakket']
							}
						}
					},
					{
						'name':'Telefoon',
						'acceptRow':{
							'propertyContains':{
								'name':'description',
								'values':['T-MOBILE']
							}
						},
						'expect':1
					},
					{
						'name':'Blendle',
						'acceptRow':{
							'propertyContains':{
								'name':'info',
								'values':['Blendle']
							}
						}
					},
					{
						'name':'Spotify',
						'acceptRow':{
							'propertyContains':{
								'name':'info',
								'values':['5VL2224Q8M5JL']
							}
						},
						'expect':1
					},
					{
						'name':'De Correspondent',
						'acceptRow':{
							'propertyContains':{
								'name':'info',
								'values':['De Correspondent']
							}
						}
					}
				]
			}, self.rowCheckerFactory),
			cat.OptionableCategory({
				'name':'NS',
				'acceptRow':{
					'propertyContains':{
						'name':'description',
						'values':['NS GROEP']
					}
				}
			}, self.rowCheckerFactory),
			cat.OptionableCategory({
				'name':'Zorg',
				'acceptRow':{
					'propertyContains':{
						'name':'description',
						'values':['menzis', 'PEARLE']
					}
				}
			}, self.rowCheckerFactory),
			cat.OptionableCategory({
				'name':'Huur',
				'acceptRow':{
					'propertyContains':{
						'name':'description',
						'values':['Rijksen Beheer']
					}
				}
			}, self.rowCheckerFactory),
			cat.OptionableCategory({
				'name':'Boeken',
				'acceptRow':{
					'propertyContains':{
						'name':'description',
						'values':['Broese Boekverkopers','BOEKHANDEL']
					}
				}
			}, self.rowCheckerFactory),
			cat.OptionableCategory({
				'name':'Belastingdienst',
				'acceptRow':{
					'propertyContains':{
						'name':'description',
						'values':['Belastingdienst']
					}
				}
			}, self.rowCheckerFactory),
			cat.OptionableCategory({
				'name':'CJIB',
				'acceptRow':{
					'propertyContains':{
						'name':'description',
						'values':['CJIB']
					}
				}
			}, self.rowCheckerFactory),
			cat.OptionableCategory({
				'name':'DUO',
				'acceptRow':{
					'propertyContains':{
						'name':'description',
						'values':['DUO']
					}
				}
			}, self.rowCheckerFactory),
			cat.OptionableCategory({
				'name':'Goed doel',
				'acceptRow':{
					'propertyContains':{
						'name':'description',
						'values':['STG CARE']
					}
				}
			}, self.rowCheckerFactory),
			cat.OptionableCategory({
				'name':'Toestelverzekering',
				'acceptRow':{
					'propertyContains':{
						'name':'info',
						'values':['Toestelverzekering']
					}
				}
			}, self.rowCheckerFactory),
			cat.OptionableCategory({
				'name':'Film',
				'acceptRow':{
					'propertyContains':{
						'name':'info',
						'values':['Louis Hartlooper','Springhaver']
					}
				}
			}, self.rowCheckerFactory),
			cat.OptionableCategory({
				'name':'Sparen',
				'acceptRow':{
					'propertyContains':{
						'name':'info',
						'values':['Naar Bonusrenterekening']
					}
				}
			}, self.rowCheckerFactory),
			Pinnen(),
			OnlineBankieren()]

	def getName(self):
		return 'Af'

	def acceptsRow(self, row):
		return row.direction == Direction.OUTGOING

class Salaris(cat.RowCategory):

	def acceptsRow(self, row):
		return row.additional['description'].startswith('T-MOBILE')

	def acceptsRowInDuplicate(self, row):
		return not self.isRecursivelyEmpty() and row.additional['description'].startswith('T-MOBILE')

	def getName(self):
		return 'Salaris'


class Bij(cat.MultipleRowCategoryWithLeftover):
	def __init__(self, rowCheckerFactory):
		self.rowCheckerFactory = rowCheckerFactory
		super(Bij, self).__init__()

	def getCategories(self):
		return [Salaris(),
				cat.OptionableCategory({
					'name':'Van spaarrekening',
					'acceptRow':{
						'propertyContains':{
							'name':'info',
							'values':['Van Bonusrenterekening']
						}
					}
				}, self.rowCheckerFactory),
				OnlineBankieren()]

	def acceptsRow(self, row):
		return row.direction == Direction.INCOMING

	def getName(self):
		return 'Bij'


class AfBij(cat.MultipleRowCategory):
	def __init__(self, rowCheckerFactory):
		self.af = Af(rowCheckerFactory)
		self.bij = Bij(rowCheckerFactory)
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
	def __init__(self, rowCheckerFactory):
		self.rowCheckerFactory = rowCheckerFactory
		super(TopCategory, self).__init__()

	def renewCategory(self, oldCategory):
		newCategory = AfBij(self.rowCheckerFactory)
		if not oldCategory == None:
			oldCategory.end()
			newCategory.begin()
		
		return newCategory

	def getName(self):
		return 'maanden'
