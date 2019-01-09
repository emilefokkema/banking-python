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

testClasses = []

def test(testClass):
	testClasses.append(testClass)
	return testClass

def getJsonObj(printable):
	return printJson(printable)

class TestFailure(BaseException):
	pass

def wrapAssertion(whatToPrint):
	def wrapper(asserter):
		def wrapFn(*args):
			try:
				asserter(*args)
			except AssertionError:
				print(whatToPrint(*args))
				raise
		return wrapFn
	return wrapper

@wrapAssertion(lambda one, two:'expected '+repr(one)+' to equal '+repr(two))
def assertEquals(one, two):
	assert one == two

@wrapAssertion(lambda obj, _type:'expected '+repr(obj)+' to be of type '+repr(_type))
def assertInstance(obj, _type):
	assert isinstance(obj, _type)

@wrapAssertion(lambda key, _dict:'expected dictionary '+repr(_dict)+' to contain key '+key)
def assertInDict(key, _dict):
	assert key in _dict

@wrapAssertion(lambda list1, list2:'expected list '+repr(list1)+' and list '+repr(list2)+' to be of equal length')
def assertEqualLength(list1, list2):
	assert len(list1) == len(list2)

@wrapAssertion(lambda obj1, obj2:'expected '+repr(obj1)+' to deep-equal '+repr(obj2))
def assertDeepEquals(obj1, obj2):
	if isinstance(obj1, dict):
		assertInstance(obj2, dict)
		for p in obj1:
			assertInDict(p, obj2)
			assertDeepEquals(obj1[p], obj2[p])
		for p in obj2:
			assertInDict(p, obj1)
			assertDeepEquals(obj2[p], obj1[p])
	elif isinstance(obj1, list):
		assertInstance(obj2, list)
		assertEqualLength(obj1, obj2)
		for index in range(len(obj1)):
			assertDeepEquals(obj1[index], obj2[index])
	else:
		assertEquals(obj1, obj2)

class RowFactoryTest:
	def __init__(self):
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

@test
class RowFactoryTest1(RowFactoryTest):

	def test(self):
		factory = RowFactory(self.options)
		row = factory.createRow(['20180509','34.34','in','something'])
		assertEquals(row['date'], datetime(2018, 5, 9))
		assertEquals(row['amount'], 3434)
		assertEquals(row['direction'], Direction.INCOMING)
		assertEquals(row['info'], 'something')

@test
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

		assertEquals(dateProp.getValue(row), datetime(2018, 5, 9))
		assertEquals(amountProp.getValue(row), 3434)
		assertEquals(directionProp.getValue(row), Direction.INCOMING)
		assertEquals(infoProp.getValue(row), 'something')

class RowCheckerFactoryTest:
	def __init__(self):
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

@test
class PropertyContainsTest(RowCheckerFactoryTest):

	def test(self):
		rowChecker = self.rowCheckerFactory.getRowChecker({
			'propertyContains':{
				'name':'info',
				'values':['abraham','lincoln']
			}
		})
		row = self.rowFactory.createRow(['20180509','34.34','in','something'])
		assertEquals(rowChecker.checkRow(row), False)
		row = self.rowFactory.createRow(['20180509','34.34','in','abraham'])
		assertEquals(rowChecker.checkRow(row), True)

@test
class PropertyContainsTestWithTrickyCharacters(RowCheckerFactoryTest):

	def test(self):
		rowChecker = self.rowCheckerFactory.getRowChecker({
			'propertyContains':{
				'name':'info',
				'values':['amazon.com']
			}
		})
		row = self.rowFactory.createRow(['20180509','34.34','in','to amazon.com'])
		assertEquals(rowChecker.checkRow(row), True)
		row = self.rowFactory.createRow(['20180509','34.34','in','to amazonacom'])
		assertEquals(rowChecker.checkRow(row), False)

@test
class PropertyMatchesTest(RowCheckerFactoryTest):

	def test(self):
		rowChecker = self.rowCheckerFactory.getRowChecker({
			'propertyMatches':{
				'name':'info',
				'pattern':r'(?<=abraham\s)lincoln'
			}
		})
		row = self.rowFactory.createRow(['20180509','34.34','in','simon lincoln'])
		assertEquals(rowChecker.checkRow(row), False)
		row = self.rowFactory.createRow(['20180509','34.34','in','abraham lincoln'])
		assertEquals(rowChecker.checkRow(row), True)

@test
class IncomingTest(RowCheckerFactoryTest):

	def test(self):
		rowChecker = self.rowCheckerFactory.getRowChecker({
			'incoming':True
		})
		row = self.rowFactory.createRow(['20180509','34.34','out','something'])
		assertEquals(rowChecker.checkRow(row), False)
		row = self.rowFactory.createRow(['20180509','34.34','in','something'])
		assertEquals(rowChecker.checkRow(row), True)

class RowCollectionTest:
	def __init__(self):
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

@test
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
		assertDeepEquals(getJsonObj(collection), {
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

@test
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
		assertDeepEquals(getJsonObj(collection), {
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

@test
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
		assertDeepEquals(getJsonObj(collection), {
			'items':[
				{
					'properties':[
						{'name':'date','type':'date','value':datetime(2018,5,8,12,34)},
						{'name':'amount','type':'amount','value':3467}
					]
				}
			]
		})

@test
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
		collectionObj = getJsonObj(collection)
		items = collectionObj['items']
		assertEquals(len(items), 3)
		assertInDict('more', collectionObj)
		assertEquals(collectionObj['more'], 1)

@test
class RowCollectionTestWithDefault(RowCollectionTest):

	def test(self):
		collection = self.rowCollectionFactory.getDefault({'default':True})
		collection.addRow(self.rowFactory.createRow(['20180509','34.67', 'in', 'something on 08/05/2018 12:34']))
		assertDeepEquals(getJsonObj(collection), {
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

class CategoryTest:
	def __init__(self):
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

@test
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
		assertEquals(category.canAddRow(row), True)
		category.addRow(row)
		assertDeepEquals(getJsonObj(category), {
			'name':'test',
			'total': 3467,
			'categories':[
				{
					'name':'one',
					'total':3467
				}
			]
		})

@test
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
		assertEquals(category.canAddRow(row), True)
		category.addRow(row)
		assertDeepEquals(getJsonObj(category), {
			'name':'test',
			'total': 3467,
			'categories':[
				{
					'name':'two',
					'total':3467
				}
			]
		})

@test
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
		assertEquals(category.canAddRow(row), False)

@test
class TestCategoryWithExpectationExceeded(CategoryTest):

	def test(self):
		category = self.makeCategory({'name':'test','expect':1})
		for i in range(3):
			category.addRow(self.rowFactory.createRow(['20180509','34.67', 'in', 'something on 08/05/2018 12:34']))
		assertDeepEquals(getJsonObj(category), {
			'name':'test',
			'total':3 * 3467,
			'expectation':{
				'expected':1,
				'actual':3,
				'dates':[datetime(2018,5,9),datetime(2018,5,9),datetime(2018,5,9)]
			}
		})

@test
class TestCategoryWithExpectationNotExceeded(CategoryTest):

	def test(self):
		category = self.makeCategory({'name':'test','expect':1})
		category.addRow(self.rowFactory.createRow(['20180509','34.67', 'in', 'something on 08/05/2018 12:34']))
		assertDeepEquals(getJsonObj(category), {
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

@test
class TestFirstOther(OncePerPeriodTest):

	def test(self):
		category = self.makeCategory()
		otherRow = self.rowFactory.createRow(['20180509','34.67', 'in', 'something else'])
		paycheckRow = self.rowFactory.createRow(['20180509','34.67', 'in', 'paycheck'])

		assertEquals(category.acceptsRowInDuplicate(otherRow), False)
		assertEquals(category.acceptsRowInDuplicate(paycheckRow), False)

		category.addRow(otherRow)

		assertEquals(category.acceptsRowInDuplicate(otherRow), False)
		assertEquals(category.acceptsRowInDuplicate(paycheckRow), True)

@test
class TestFirstOPP(OncePerPeriodTest):

	def test(self):
		category = self.makeCategory()
		otherRow = self.rowFactory.createRow(['20180509','34.67', 'in', 'something else'])
		paycheckRow = self.rowFactory.createRow(['20180509','34.67', 'in', 'paycheck'])

		assertEquals(category.acceptsRowInDuplicate(otherRow), False)
		assertEquals(category.acceptsRowInDuplicate(paycheckRow), False)

		category.addRow(paycheckRow)

		assertEquals(category.acceptsRowInDuplicate(otherRow), False)
		assertEquals(category.acceptsRowInDuplicate(paycheckRow), True)

@test
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

@test
class TestAfBijWithStart(TestAfBij):

	def test(self):
		afbij = self.makeAfBij()
		afbij.addRow(self.rowFactory.createRow(['20180509','34.67', 'in', 'paycheck']))
		afbijObj = getJsonObj(afbij)
		assertEquals(afbijObj['from'], datetime(2018,5,9))
		assertEquals(afbijObj['hasBeginning'], True)

@test
class TestAfBijWithLeftover(TestAfBij):

	def test(self):
		afbij = self.makeAfBij()
		afbij.addRow(self.rowFactory.createRow(['20180509','34.67', 'out', 'something']))
		afbijObj = getJsonObj(afbij)
		assertDeepEquals(afbijObj['Af'], {
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

@test
class TestTwoIncomplete(CsvProcessorTest):

	def test(self):
		dataprovider, processor = self.makeProcessor()
		rows = [
			'"20180509","1.00","out","something"',
			'"20180509","65.00","in","paycheck"',
			'"20180509","1.00","out","something"']
		result = processor.processCsv(rows)
		assertEquals(dataprovider.getItem('history'), None)
		assertEquals(len(result), 1)

@test
class TestOneComplete(CsvProcessorTest):

	def test(self):
		dataprovider, processor = self.makeProcessor()
		rows = [
			'"20180609","65.00","in","paycheck"',
			'"20180509","1.00","out","something"',
			'"20180509","65.00","in","paycheck"',
			'"20180509","1.00","out","something"']
		result = processor.processCsv(rows)
		assertDeepEquals(dataprovider.getItems(kind='historyitem'), [{'fileName':'2018-05-092018-05-09','date':datetime(2018,5,9)}])
		assertEquals(len(result), 2)
		assertDeepEquals(result[0],{
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

@test
class TestHistoryRemove:

	def test(self):
		dataprovider = MockDataProvider()
		dataprovider.addItem({'fileName':'2018-05-092018-05-09','date':datetime(2018,5,9)}, kind='historyitem')
		history = PeriodHistory(dataprovider)

		history.removeItem('2018-05-092018-05-09')

		assertEquals(dataprovider.getItems(kind='historyitem'), [])

@test
class TestHistoryAll:

	def test(self):
		dataprovider = MockDataProvider()
		dataprovider.addItem({'fileName':'2018-05-092018-05-09','date':datetime(2018,5,9)}, kind='historyitem')
		history = PeriodHistory(dataprovider)
		all = history.getAll()

		assertDeepEquals(all, {'isMore':False, 'items':[{'fileName':'2018-05-092018-05-09'}], 'earliestDate':datetime(2018,5,9)})

class MockPeriod:
	def printSelf(self, printer):
		printer.writeLine('foo','bar')

	def makeFileName(self):
		return 'fileName'

	def getFrom(self):
		return datetime(2018,1,1)

@test
class TestHistoryNoDuplicateFileNames:

	def test(self):
		dataprovider = MockDataProvider()
		history = PeriodHistory(dataprovider)
		period = MockPeriod()

		history.addItem(period)
		history.addItem(period)

		items = history.getAll()['items']
		assertEquals(len(items), 1)


@test
class TestFilteringLikeGoogle:

	def test(self):
		item1 = {'value':7,'name':'emile'}
		item2 = {'value':10,'name':'harry'}
		filters1 = ('value','>',8),
		filters2 = ('value','<',20),('name','=','emile')

		assertEquals(filterItemLikeGoogle(item1, filters1), False)
		assertEquals(filterItemLikeGoogle(item1, filters2), True)
		assertEquals(filterItemLikeGoogle(item2, filters1), True)
		assertEquals(filterItemLikeGoogle(item2, filters2), False)

@test
class TestOrderingLikeGoogle:

	def test(self):
		items = [{'name':'b', 'age':2},{'name':'a', 'age':1},{'name':'b', 'age':1}, {'name':'a', 'age':2}]
		result = [{'name':'a', 'age':2},{'name':'a', 'age':1},{'name':'b', 'age':2},{'name':'b', 'age':1}]
		assertDeepEquals(orderedLikeGoogle(items, order=('name', '-age')), result)

@test
class TestOrderFilterAndLimitLikeGoogle:

	def test(self):
		items = [{'name':'c', 'age':2},{'name':'d', 'age':2}, {'name':'b', 'age':3},{'name':'a', 'age':2}]
		result = [{'name':'a', 'age':2},{'name':'c', 'age':2}]
		assertDeepEquals(orderFilterAndLimitLikeGoogle(items, order=('name',), filters=(('age','=', 2),), limit=2), result)

def runTests():
	failed = []
	passed = 0
	tests = [tc() for tc in testClasses]

	for test in tests:
		try:
			test.test()
			passed += 1
		except BaseException:
			traceback.print_exc()
			failed.append(type(test).__name__)

	print('tests passed: ',passed)
	print('tests failed: ', '\n'.join(failed) if len(failed) > 0 else '0')

runTests()