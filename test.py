from rowfactory import RowFactory
from rowcheckerfactory import RowCheckerFactory
from datetime import datetime
from direction import Direction
import traceback

class TestFailure(BaseException):
	pass

def assertEquals(one, two):
	try:
		assert one == two
	except AssertionError:
		print('failure: expected '+repr(one)+' to equal '+repr(two))
		traceback.print_exc()
		raise TestFailure()

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

class RowFactoryTest1(RowFactoryTest):

	def test(self):
		factory = RowFactory(self.options)
		row = factory.createRow(['20180509','34.34','in','something'])
		assertEquals(row['date'], datetime(2018, 5, 9))
		assertEquals(row['amount'], 3434)
		assertEquals(row['direction'], Direction.INCOMING)
		assertEquals(row['info'], 'something')

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

class IncomingTest(RowCheckerFactoryTest):

	def test(self):
		rowChecker = self.rowCheckerFactory.getRowChecker({
			'incoming':True
		})
		row = self.rowFactory.createRow(['20180509','34.34','out','something'])
		assertEquals(rowChecker.checkRow(row), False)
		row = self.rowFactory.createRow(['20180509','34.34','in','something'])
		assertEquals(rowChecker.checkRow(row), True)

def runTests():
	failed = 0
	passed = 0
	tests = [
		RowFactoryTest1(),
		RowFactoryTest2(),
		PropertyContainsTest(),
		PropertyMatchesTest(),
		IncomingTest()
		]

	for test in tests:
		try:
			test.test()
			passed += 1
		except TestFailure:
			failed += 1
		except BaseException:
			traceback.print_exc()
			failed += 1

	print('tests passed: ',passed)
	print('tests failed: ', failed)

runTests()