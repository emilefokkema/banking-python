from datetime import datetime
from direction import Direction
from rowpropertytype import RowPropertyType
import re

class RowPropertyParser:
	def __init__(self, name, _type, options):
		self.columnIndex = options['columnIndex']
		self.name = name
		self.type = _type

	def parseValue(self, csvRowValue):
		return csvRowValue

	def setValue(self, row, csvRow):
		row[self.name] = self.parseValue(csvRow[self.columnIndex])

	def getValue(self, row):
		return row[self.name]


class RowDateParser(RowPropertyParser):
	def __init__(self, options):
		super(RowDateParser, self).__init__('date', RowPropertyType.DATE, options)
		self.pattern = options['pattern']

	def parseValue(self, csvRowValue):
		return datetime.strptime(csvRowValue, self.pattern)

class RowNumberOfCentsParser(RowPropertyParser):
	def __init__(self, options):
		super(RowNumberOfCentsParser, self).__init__('amount', RowPropertyType.AMOUNT, options)

	def parseValue(self, csvRowValue):
		return int(''.join(re.findall(r'\d+', csvRowValue)))

class RowDirectionParser(RowPropertyParser):
	def __init__(self, options):
		super(RowDirectionParser, self).__init__('direction', RowPropertyType.DIRECTION, options)
		self.incomingValue = options['incoming']
		self.outgoingValue = options['outgoing']

	def parseValue(self, csvRowValue):
		if csvRowValue == self.incomingValue:
			return Direction.INCOMING
		return Direction.OUTGOING

class RowFactory:
	def __init__(self, options):
		self.properties = [
			RowDirectionParser(options['direction']),
			RowDateParser(options['date']),
			RowNumberOfCentsParser(options['amount'])] + ([RowPropertyParser(_ops['name'], RowPropertyType.STRING, _ops) for _ops in options['additional']] if 'additional' in options else [])


	def getProperty(self, name):
		for prop in self.properties:
			if prop.name == name:
				return prop
		raise Exception('unknown property name '+name)

	def createRow(self, csvRow):
		result = {}
		for prop in self.properties:
			prop.setValue(result, csvRow)
		return result

