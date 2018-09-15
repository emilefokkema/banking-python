import re
from src.direction import Direction

class AcceptingRowChecker:
	def checkRow(self, row):
		return True

class RegexRowChecker:
	def __init__(self, pattern, getStringProperty):
		self.pattern = pattern
		self.getStringProperty = getStringProperty

	def checkRow(self, row):
		return not re.search(self.pattern, self.getStringProperty(row), re.I) == None

class RowPropertyContainsChecker(RegexRowChecker):
	def __init__(self, getStringProperty, substrs):
		pattern = '(?:'+'|'.join([re.escape(substr) for substr in substrs])+')'
		super(RowPropertyContainsChecker, self).__init__(pattern, getStringProperty)

class DirectionChecker:
	def __init__(self, direction):
		self.direction = direction

	def checkRow(self, row):
		return row['direction'] == self.direction

class RowCheckerFactory:
	def __init__(self, rowFactory):
		self.rowFactory = rowFactory

	def getRowChecker(self, options):
		if options == None:
			return AcceptingRowChecker()
		if isinstance(options, RowPropertyContainsChecker):
			return options
		if 'propertyContains' in options:
			containsOptions = options['propertyContains']
			rowproperty = self.rowFactory.getProperty(containsOptions['name'])
			values = containsOptions['values']
			return RowPropertyContainsChecker(lambda r:rowproperty.getValue(r), values)
		if 'propertyMatches' in options:
			matchesOptions = options['propertyMatches']
			rowproperty = self.rowFactory.getProperty(matchesOptions['name'])
			pattern = matchesOptions['pattern']
			return RegexRowChecker(pattern, lambda r:rowproperty.getValue(r))
		if 'incoming' in options and options['incoming'] == True:
			return DirectionChecker(Direction.INCOMING)
		if 'outgoing' in options and options['outgoing'] == True:
			return DirectionChecker(Direction.OUTGOING)
