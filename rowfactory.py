from datepattern import DatePattern
from direction import Direction
import re

class RowPropertyParser:
	def __init__(self, options):
		self.columnIndex = options['columnIndex']

	def getValue(self, csvRow):
		return self.parseValue(csvRow[self.columnIndex])

	def parseValue(self, csvRowValue):
		return csvRowValue

class NamedRowPropertyParser(RowPropertyParser):
	def __init__(self, options):
		super(NamedRowPropertyParser, self).__init__(options)
		self.name = options['name']

class RowDateParser(RowPropertyParser):
	def __init__(self, options):
		super(RowDateParser, self).__init__(options)
		self.pattern = DatePattern(options['pattern'])

	def parseValue(self, csvRowValue):
		return self.pattern.parse(csvRowValue)

class RowNumberOfCentsParser(RowPropertyParser):
	def __init__(self, options):
		super(RowNumberOfCentsParser, self).__init__(options)

	def parseValue(self, csvRowValue):
		return int(''.join(re.findall(r'\d+', csvRowValue)))

class RowDirectionParser(RowPropertyParser):
	def __init__(self, options):
		super(RowDirectionParser, self).__init__(options)
		self.incomingValue = options['incoming']
		self.outgoingValue = options['outgoing']

	def parseValue(self, csvRowValue):
		if csvRowValue == self.incomingValue:
			return Direction.INCOMING
		return Direction.OUTGOING



class Row:
	def __init__(self, date, direction, numberOfCents, additional):
		self.direction = direction
		self.numberOfCents = numberOfCents
		self.date = date
		self.additional = additional

	def getDescription(self):
		if not self.additional == None:
			return ' '.join([self.additional[p] for p in self.additional])
		return 'description'


class RowFactory:
	def __init__(self, options):
		self.rowDirectionParser = RowDirectionParser(options['direction'])
		self.rowDateParser = RowDateParser(options['date'])
		self.rowNumberOfCentsParser = RowNumberOfCentsParser(options['amount'])
		self.namedParsers = []
		self.hasAdditional = False
		if options['additional']:
			self.hasAdditional = True
			self.namedParsers = [NamedRowPropertyParser(_ops) for _ops in options['additional']]

	def getProperty(self, name):
		if name == 'direction':
			return lambda r:r.direction
		if name == 'numberOfCents':
			return lambda r:r.numberOfCents
		if name == 'date':
			return lambda r:r.date
		if not self.hasAdditional:
			raise Exception('unknown property name '+name)
		for namedParser in self.namedParsers:
			if namedParser.name == name:
				return lambda r:r.additional[name]
		raise Exception('unknown property name '+name)

	def createRow(self, csvRow):
		date = self.rowDateParser.getValue(csvRow)
		direction = self.rowDirectionParser.getValue(csvRow)
		numberOfCents = self.rowNumberOfCentsParser.getValue(csvRow)
		additional = None
		if self.hasAdditional:
			additional = {}
			for namedParser in self.namedParsers:
				additional[namedParser.name] = namedParser.getValue(csvRow)
		return Row(date, direction, numberOfCents, additional)

