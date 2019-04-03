import unittest
from src.rowfactory import RowFactory
from src.rowcheckerfactory import RowCheckerFactory
from src.rowcollection import RowCollectionFactory
from src.jsonprinter import printJson
from src.csvprocessor import CsvProcessor
from src.cat import OptionableCategory
from src.custom import AfBij
from datetime import datetime
from src.direction import Direction
from src.periodhistory import PeriodHistory
import traceback
from src.filterlikegoogle import filterItemLikeGoogle
from src.orderedlikegoogle import orderedLikeGoogle
from src.orderfilterandlimitlikegoogle import orderFilterAndLimitLikeGoogle

class RowFactoryTest(unittest.TestCase):
	def __init__(self, *args, **kwargs):
		super(RowFactoryTest, self).__init__(*args, **kwargs)
		self.options = {
			'date':{
				'columnIndex':0,
				'pattern':'yyyymmdd'
			},
			'amount':{
				'columnIndex':1
			},
			'direction':{
				'columnIndex':2,
				'incoming':'in',
				'outgoing':'out'
			},
			'additional':[
				{
					'name':'info',
					'columnIndex':3
				}
			]
		}


class RowFactoryTest1(RowFactoryTest):

	def test(self):
		factory = RowFactory(self.options)
		row = factory.createRow(['20180509','34.34','in','something'])
		self.assertEqual(row['date'], datetime(2018, 5, 9))
		self.assertEqual(row['amount'], 3434)
		self.assertEqual(row['direction'], Direction.INCOMING)
		self.assertEqual(row['info'], 'something')

class RowFactoryTest2(RowFactoryTest):

	def test(self):
		self.options['date']['pattern'] = 'dd-mm-yy'
		self.options['direction']['incoming'] = 'credit'
		self.options['additional'][0]['columnIndex'] = 4
		factory = RowFactory(self.options)
		row = factory.createRow(['09-05-18','34,34','credit','nothing', 'something'])
		dateProp = factory.getProperty('date')
		amountProp = factory.getProperty('amount')
		directionProp = factory.getProperty('direction')
		infoProp = factory.getProperty('info')

		self.assertEqual(dateProp.getValue(row), datetime(2018, 5, 9))
		self.assertEqual(amountProp.getValue(row), 3434)
		self.assertEqual(directionProp.getValue(row), Direction.INCOMING)
		self.assertEqual(infoProp.getValue(row), 'something')

class RowCheckerFactoryTest(unittest.TestCase):
	def __init__(self, *args, **kwargs):
		super(RowCheckerFactoryTest, self).__init__(*args, **kwargs)
		self.rowFactory = RowFactory({
			'date':{
				'columnIndex':0,
				'pattern':'yyyymmdd'
			},
			'amount':{
				'columnIndex':1
			},
			'direction':{
				'columnIndex':2,
				'incoming':'in',
				'outgoing':'out'
			},
			'additional':[
				{
					'name':'info',
					'columnIndex':3
				}
			]
		})
		self.rowCheckerFactory = RowCheckerFactory(self.rowFactory)


class PropertyContainsTest(RowCheckerFactoryTest):

	def test(self):
		rowChecker = self.rowCheckerFactory.getRowChecker({
			'propertyContains':{
				'name':'info',
				'values':['abraham','lincoln']
			}
		})
		row = self.rowFactory.createRow(['20180509','34.34','in','something'])
		self.assertEqual(rowChecker.checkRow(row), False)
		row = self.rowFactory.createRow(['20180509','34.34','in','abraham'])
		self.assertEqual(rowChecker.checkRow(row), True)


class PropertyContainsTestWithTrickyCharacters(RowCheckerFactoryTest):

	def test(self):
		rowChecker = self.rowCheckerFactory.getRowChecker({
			'propertyContains':{
				'name':'info',
				'values':['amazon.com']
			}
		})
		row = self.rowFactory.createRow(['20180509','34.34','in','to amazon.com'])
		self.assertEqual(rowChecker.checkRow(row), True)
		row = self.rowFactory.createRow(['20180509','34.34','in','to amazonacom'])
		self.assertEqual(rowChecker.checkRow(row), False)


class PropertyMatchesTest(RowCheckerFactoryTest):

	def test(self):
		rowChecker = self.rowCheckerFactory.getRowChecker({
			'propertyMatches':{
				'name':'info',
				'pattern':r'(?<=abraham\s)lincoln'
			}
		})
		row = self.rowFactory.createRow(['20180509','34.34','in','simon lincoln'])
		self.assertEqual(rowChecker.checkRow(row), False)
		row = self.rowFactory.createRow(['20180509','34.34','in','abraham lincoln'])
		self.assertEqual(rowChecker.checkRow(row), True)


class IncomingTest(RowCheckerFactoryTest):

	def test(self):
		rowChecker = self.rowCheckerFactory.getRowChecker({
			'incoming':True
		})
		row = self.rowFactory.createRow(['20180509','34.34','out','something'])
		self.assertEqual(rowChecker.checkRow(row), False)
		row = self.rowFactory.createRow(['20180509','34.34','in','something'])
		self.assertEqual(rowChecker.checkRow(row), True)

class RowCollectionTest(unittest.TestCase):
	def __init__(self, *args, **kwargs):
		super(RowCollectionTest, self).__init__(*args, **kwargs)
		self.rowFactory = RowFactory({
			'date':{
				'columnIndex':0,
				'pattern':'yyyymmdd'
			},
			'amount':{
				'columnIndex':1
			},
			'direction':{
				'columnIndex':2,
				'incoming':'in',
				'outgoing':'out'
			},
			'additional':[
				{
					'name':'info',
					'columnIndex':3
				}
			]
		})
		self.rowCollectionFactory = RowCollectionFactory(self.rowFactory)


class RowCollectionTestWithStringConversion(RowCollectionTest):

	def test(self):
		collection = self.rowCollectionFactory.getDefault({
			'properties':[
				{
					'name':'date',
					'source':'date'
				},
				{
					'name':'infoPart',
					'source':'info',
					'conversion':{
						'type':'string',
						'match':r'(?<=abraham\s)(?:(?!\W).)*'
					}
				},
				{
					'name':'amount',
					'source':'amount'
				}
			]
		})
		collection.addRow(self.rowFactory.createRow(['20180509','34.67', 'in', 'abraham lincoln\'s car']))
		self.assertEqual(printJson(collection), {
			'items':[
				{
					'properties':[
						{'name':'date','type':'date','value':datetime(2018,5,9)},
						{'name':'infoPart','type':'string','value':'lincoln'},
						{'name':'amount','type':'amount','value':3467}
					]
				}
			]
		})


class RowCollectionTestWithStringConversionNoMatch(RowCollectionTest):

	def test(self):
		collection = self.rowCollectionFactory.getDefault({
			'properties':[
				{
					'name':'date',
					'source':'date'
				},
				{
					'name':'infoPart',
					'source':'info',
					'conversion':{
						'type':'string',
						'match':r'(?<=abraham\s)(?:(?!\W).)*'
					}
				},
				{
					'name':'amount',
					'source':'amount'
				}
			]
		})
		collection.addRow(self.rowFactory.createRow(['20180509','34.67', 'in', 'lincoln\'s car']))
		self.assertEqual(printJson(collection), {
			'items':[
				{
					'properties':[
						{'name':'date','type':'date','value':datetime(2018,5,9)},
						{'name':'infoPart','type':'string','value':''},
						{'name':'amount','type':'amount','value':3467}
					]
				}
			]
		})


class RowCollectionTestWithDateConversion(RowCollectionTest):

	def test(self):
		collection = self.rowCollectionFactory.getDefault({
			'properties':[
				{
					'name':'date',
					'source':'info',
					'conversion':{
						'type':'date',
						'pattern':r'%d/%m/%Y %H:%M'
					}
				},
				{
					'name':'amount',
					'source':'amount'
				}
			]
		})
		collection.addRow(self.rowFactory.createRow(['20180509','34.67', 'in', 'something on 08/05/2018 12:34']))
		self.assertEqual(printJson(collection), {
			'items':[
				{
					'properties':[
						{'name':'date','type':'date','value':datetime(2018,5,8,12,34)},
						{'name':'amount','type':'amount','value':3467}
					]
				}
			]
		})


class RowCollectionTestWithDisplayLimit(RowCollectionTest):

	def test(self):
		collection = self.rowCollectionFactory.getDefault({
			'properties':[
				{
					'name':'date',
					'source':'info',
					'conversion':{
						'type':'date',
						'pattern':r'%d/%m/%Y %H:%M'
					}
				},
				{
					'name':'amount',
					'source':'amount'
				}
			],
			'displayLimit':3
		})
		for i in range(4):
			collection.addRow(self.rowFactory.createRow(['20180509','34.67', 'in', 'something on 08/05/2018 12:34']))
		collectionObj = printJson(collection)
		items = collectionObj['items']
		self.assertEqual(len(items), 3)
		self.assertTrue('more' in collectionObj)
		self.assertEqual(collectionObj['more'], 1)


class RowCollectionTestWithDefault(RowCollectionTest):

	def test(self):
		collection = self.rowCollectionFactory.getDefault({'default':True})
		collection.addRow(self.rowFactory.createRow(['20180509','34.67', 'in', 'something on 08/05/2018 12:34']))
		self.assertEqual(printJson(collection), {
			'items':[
				{
					'properties':[
						{'name':'direction', 'type':'direction', 'value':Direction.INCOMING},
						{'name':'date','type':'date','value':datetime(2018,5,9)},
						{'name':'amount','type':'amount','value':3467},
						{'name':'info','type':'string','value':'something on 08/05/2018 12:34'}
					]
				}
			]
		})

class CategoryTest(unittest.TestCase):
	def __init__(self, *args, **kwargs):
		super(CategoryTest, self).__init__(*args, **kwargs)
		self.rowFactory = RowFactory({
			'date':{
				'columnIndex':0,
				'pattern':'yyyymmdd'
			},
			'amount':{
				'columnIndex':1
			},
			'direction':{
				'columnIndex':2,
				'incoming':'in',
				'outgoing':'out'
			},
			'additional':[
				{
					'name':'info',
					'columnIndex':3
				}
			]
		})
		self.rowCollectionFactory = RowCollectionFactory(self.rowFactory)
		self.rowCheckerFactory = RowCheckerFactory(self.rowFactory)

	def makeCategory(self, options):
		return OptionableCategory(options, self.rowCheckerFactory, self.rowCollectionFactory)


class TestCategoryOrder(CategoryTest):

	def test(self):
		category = self.makeCategory({
			'name':'test',
			'categories':[
				{
					'name':'one'
				},
				{
					'name':'two'
				}
			]
		})
		row = self.rowFactory.createRow(['20180509','34.67', 'in', 'something on 08/05/2018 12:34'])
		self.assertEqual(category.canAddRow(row), True)
		category.addRow(row)
		self.assertEqual(printJson(category), {
			'name':'test',
			'total': 3467,
			'categories':[
				{
					'name':'one',
					'total':3467
				}
			]
		})


class TestCategoryOrderFirstNoMatch(CategoryTest):

	def test(self):
		category = self.makeCategory({
			'name':'test',
			'categories':[
				{
					'name':'one',
					'acceptRow':{
						'propertyContains':{
							'name':'info',
							'values':['nothing']
						}
					}
				},
				{
					'name':'two'
				}
			]
		})
		row = self.rowFactory.createRow(['20180509','34.67', 'in', 'something on 08/05/2018 12:34'])
		self.assertEqual(category.canAddRow(row), True)
		category.addRow(row)
		self.assertEqual(printJson(category), {
			'name':'test',
			'total': 3467,
			'categories':[
				{
					'name':'two',
					'total':3467
				}
			]
		})


class TestCategoryOrderNeitherMatches(CategoryTest):

	def test(self):
		category = self.makeCategory({
			'name':'test',
			'categories':[
				{
					'name':'one',
					'acceptRow':{
						'propertyContains':{
							'name':'info',
							'values':['nothing']
						}
					}
				},
				{
					'name':'two',
					'acceptRow':{
						'propertyContains':{
							'name':'info',
							'values':['everything']
						}
					}
				}
			]
		})
		row = self.rowFactory.createRow(['20180509','34.67', 'in', 'something on 08/05/2018 12:34'])
		self.assertEqual(category.canAddRow(row), False)


class TestCategoryWithExpectationExceeded(CategoryTest):

	def test(self):
		category = self.makeCategory({'name':'test','expect':1})
		for i in range(3):
			category.addRow(self.rowFactory.createRow(['20180509','34.67', 'in', 'something on 08/05/2018 12:34']))
		self.assertEqual(printJson(category), {
			'name':'test',
			'total':3 * 3467,
			'expectation':{
				'expected':1,
				'actual':3,
				'dates':[datetime(2018,5,9),datetime(2018,5,9),datetime(2018,5,9)]
			}
		})


class TestCategoryWithExpectationNotExceeded(CategoryTest):

	def test(self):
		category = self.makeCategory({'name':'test','expect':1})
		category.addRow(self.rowFactory.createRow(['20180509','34.67', 'in', 'something on 08/05/2018 12:34']))
		self.assertEqual(printJson(category), {
			'name':'test',
			'total':3467
		})

class OncePerPeriodTest(CategoryTest):

	def makeCategory(self):
		return super(OncePerPeriodTest, self).makeCategory({
			'name':'incoming',
			'categories':[
				{
					'name':'paycheck',
					'acceptRow':{
						'propertyContains':{
							'name':'info',
							'values':['paycheck']
						}
					},
					'oncePerPeriod':True
				},
				{
					'name':'other'
				}
			]
		})


class TestFirstOther(OncePerPeriodTest):

	def test(self):
		category = self.makeCategory()
		otherRow = self.rowFactory.createRow(['20180509','34.67', 'in', 'something else'])
		paycheckRow = self.rowFactory.createRow(['20180509','34.67', 'in', 'paycheck'])

		self.assertEqual(category.acceptsRowInDuplicate(otherRow), False)
		self.assertEqual(category.acceptsRowInDuplicate(paycheckRow), False)

		category.addRow(otherRow)

		self.assertEqual(category.acceptsRowInDuplicate(otherRow), False)
		self.assertEqual(category.acceptsRowInDuplicate(paycheckRow), True)


class TestFirstOPP(OncePerPeriodTest):

	def test(self):
		category = self.makeCategory()
		otherRow = self.rowFactory.createRow(['20180509','34.67', 'in', 'something else'])
		paycheckRow = self.rowFactory.createRow(['20180509','34.67', 'in', 'paycheck'])

		self.assertEqual(category.acceptsRowInDuplicate(otherRow), False)
		self.assertEqual(category.acceptsRowInDuplicate(paycheckRow), False)

		category.addRow(paycheckRow)

		self.assertEqual(category.acceptsRowInDuplicate(otherRow), False)
		self.assertEqual(category.acceptsRowInDuplicate(paycheckRow), True)


class TestAfBijConstructor(CategoryTest):

	def test(self):
		afbij = AfBij({
			'outgoing':{
				'name':'out'
			},
			'incoming':{
				'name':'in'
			}
		}, self.rowCheckerFactory, self.rowCollectionFactory)

class TestAfBij(CategoryTest):

	def makeAfBij(self):
		return AfBij({
			'outgoing':{
				'name':'out',
				'categories':[]
			},
			'incoming':{
				'name':'in',
				'categories':[
					{
						'name':'paycheck',
						'acceptRow':{
							'propertyContains':{
								'name':'info',
								'values':['paycheck']
							}
						},
						'oncePerPeriod':True
					}
				]
			}
		}, self.rowCheckerFactory, self.rowCollectionFactory)


class TestAfBijWithStart(TestAfBij):

	def test(self):
		afbij = self.makeAfBij()
		afbij.addRow(self.rowFactory.createRow(['20180509','34.67', 'in', 'paycheck']))
		afbijObj = printJson(afbij)
		self.assertEqual(afbijObj['from'], datetime(2018,5,9))
		self.assertEqual(afbijObj['hasBeginning'], True)


class TestAfBijWithLeftover(TestAfBij):

	def test(self):
		afbij = self.makeAfBij()
		afbij.addRow(self.rowFactory.createRow(['20180509','34.67', 'out', 'something']))
		afbijObj = printJson(afbij)
		self.assertEqual(afbijObj['Af'], {
			'name': 'out',
			'total': 3467,
			'categories': [
				{
					'name': 'leftovers',
					'total': 3467,
					'rows': {
						'items': [
							{
								'properties':[
									{
										'name': 'direction',
										'value': Direction.OUTGOING,
										'type': 'direction'
									},
									{
										'name': 'date',
										'value': datetime(2018,5,9),
										'type': 'date'
									},
									{
										'name': 'amount',
	 									'value': 3467,
	 									'type': 'amount'
	 								},
	 								{
	 									'name': 'info',
	 									'value': 'something',
	 									'type' : 'string'
	 								}
	 							]
							}
 						]
 					}
 				}
 			]
 		})

class MockDataProvider:
	def __init__(self):
		self.obj = {}
		self.sets = {}

	def getItem(self, key):
		if key in self.obj:
			return self.obj[key]
		return None

	def setItem(self, key, item):
		self.obj[key] = item

	def deleteItem(self, key):
		self.obj.pop(key, None)

	def getItems(self, kind=None, filters=(), limit=None, order=()):
		if not kind in self.sets:
			return []
		return [item for item in self.sets[kind] if filterItemLikeGoogle(item, filters)]

	def removeItems(self, kind=None, filters=()):
		if not kind in self.sets:
			return
		self.sets[kind] = [item for item in self.sets[kind] if not filterItemLikeGoogle(item, filters)]

	def addItem(self, item, kind=None):
		if not kind in self.sets:
			self.sets[kind] = []
		self.sets[kind].append(item)

class CsvProcessorTest(CategoryTest):

	def makeProcessor(self):
		dataprovider = MockDataProvider()
		history = PeriodHistory(dataprovider)
		processor = CsvProcessor(self.rowFactory, self.rowCheckerFactory, self.rowCollectionFactory, {
			'outgoing':{
				'name':'out',
				'categories':[]
			},
			'incoming':{
				'name':'in',
				'categories':[
					{
						'name':'paycheck',
						'acceptRow':{
							'propertyContains':{
								'name':'info',
								'values':['paycheck']
							}
						},
						'oncePerPeriod':True
					}
				]
			}
		}, history, False)
		return dataprovider, processor


class TestTwoIncomplete(CsvProcessorTest):

	def test(self):
		dataprovider, processor = self.makeProcessor()
		rows = [
			'"20180509","1.00","out","something"',
			'"20180509","65.00","in","paycheck"',
			'"20180509","1.00","out","something"']
		result = processor.processCsv(rows)
		self.assertEqual(dataprovider.getItem('history'), None)
		self.assertEqual(len(result), 1)


class TestOneComplete(CsvProcessorTest):

	def test(self):
		dataprovider, processor = self.makeProcessor()
		rows = [
			'"20180609","65.00","in","paycheck"',
			'"20180509","1.00","out","something"',
			'"20180509","65.00","in","paycheck"',
			'"20180509","1.00","out","something"']
		result = processor.processCsv(rows)
		self.assertEqual(dataprovider.getItems(kind='historyitem'), [{'fileName':'2018-05-092018-05-09','date':datetime(2018,5,9)}])
		self.assertEqual(len(result), 2)
		self.assertEqual(result[0],{
			'fileName': '2018-06-092018-06-09',
			'file': {
				'Bij': {
					'name': 'in',
					'total': 6500,
					'categories': [
						{'name': 'paycheck', 'total': 6500}
						]
					},
				'from': datetime(2018, 6, 9, 0, 0),
				'through': datetime(2018, 6, 9, 0, 0),
				'hasBeginning': True,
				'hasEnd': False,
				'balance':6500
			}
		})


class TestHistoryRemove(unittest.TestCase):

	def test(self):
		dataprovider = MockDataProvider()
		dataprovider.addItem({'fileName':'2018-05-092018-05-09','date':datetime(2018,5,9)}, kind='historyitem')
		history = PeriodHistory(dataprovider)

		history.removeItem('2018-05-092018-05-09')

		self.assertEqual(dataprovider.getItems(kind='historyitem'), [])


class TestHistoryAll(unittest.TestCase):

	def test(self):
		dataprovider = MockDataProvider()
		dataprovider.addItem({'fileName':'2018-05-092018-05-09','date':datetime(2018,5,9)}, kind='historyitem')
		history = PeriodHistory(dataprovider)
		all = history.getAll()

		self.assertEqual(all, {'isMore':False, 'items':[{'fileName':'2018-05-092018-05-09'}], 'earliestDate':datetime(2018,5,9)})

class MockPeriod:
	def printSelf(self, printer):
		printer.writeLine('foo','bar')

	def makeFileName(self):
		return 'fileName'

	def getFrom(self):
		return datetime(2018,1,1)


class TestHistoryNoDuplicateFileNames(unittest.TestCase):

	def test(self):
		dataprovider = MockDataProvider()
		history = PeriodHistory(dataprovider)
		period = MockPeriod()

		history.addItem(period)
		history.addItem(period)

		items = history.getAll()['items']
		self.assertEqual(len(items), 1)



class TestFilteringLikeGoogle(unittest.TestCase):

	def test(self):
		item1 = {'value':7,'name':'emile'}
		item2 = {'value':10,'name':'harry'}
		filters1 = ('value','>',8),
		filters2 = ('value','<',20),('name','=','emile')

		self.assertEqual(filterItemLikeGoogle(item1, filters1), False)
		self.assertEqual(filterItemLikeGoogle(item1, filters2), True)
		self.assertEqual(filterItemLikeGoogle(item2, filters1), True)
		self.assertEqual(filterItemLikeGoogle(item2, filters2), False)


class TestOrderingLikeGoogle(unittest.TestCase):

	def test(self):
		items = [{'name':'b', 'age':2},{'name':'a', 'age':1},{'name':'b', 'age':1}, {'name':'a', 'age':2}]
		result = [{'name':'a', 'age':2},{'name':'a', 'age':1},{'name':'b', 'age':2},{'name':'b', 'age':1}]
		self.assertEqual(orderedLikeGoogle(items, order=('name', '-age')), result)


class TestOrderFilterAndLimitLikeGoogle(unittest.TestCase):

	def test(self):
		items = [{'name':'c', 'age':2},{'name':'d', 'age':2}, {'name':'b', 'age':3},{'name':'a', 'age':2}]
		result = [{'name':'a', 'age':2},{'name':'c', 'age':2}]
		self.assertEqual(orderFilterAndLimitLikeGoogle(items, order=('name',), filters=(('age','=', 2),), limit=2), result)

if __name__ == '__main__':
    unittest.main()