from rowfactory import RowFactory
from rowcheckerfactory import RowCheckerFactory
from rowcollection import RowCollectionFactory
from jsonprinter import JsonPrinter
from datetime import datetime
from direction import Direction
import traceback

testClasses = []

def test(testClass):
	testClasses.append(testClass)
	return testClass

def getJsonObj(printable):
	printer = JsonPrinter()
	printable.printSelf(printer)
	return printer.getObj()

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
				[
					{'name':'date','type':'date','value':'09-05-2018 00:00'},
					{'name':'infoPart','type':'string','value':'lincoln'},
					{'name':'amount','type':'amount','value':3467}
				]
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
				[
					{'name':'date','type':'date','value':'08-05-2018 12:34'},
					{'name':'amount','type':'amount','value':3467}
				]
			]
		})


def runTests():
	failed = 0
	passed = 0
	tests = [tc() for tc in testClasses]

	for test in tests:
		try:
			test.test()
			passed += 1
		except BaseException:
			traceback.print_exc()
			failed += 1

	print('tests passed: ',passed)
	print('tests failed: ', failed)

runTests()