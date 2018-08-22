import re

class AcceptingRowChecker:
	def checkRow(self, row):
		return True

class RegexRowChecker:
	def __init__(self, pattern, getStringProperty):
		self.pattern = pattern
		self.getStringProperty = getStringProperty

	def checkRow(self, row):
		return not re.search(self.pattern, self.getStringProperty(row).lower()) == None

class RowPropertyContainsChecker(RegexRowChecker):
	def __init__(self, getStringProperty, substrs):
		pattern = '(?:'+'|'.join([s.lower() for s in substrs])+')'
		super(RowPropertyContainsChecker, self).__init__(pattern, getStringProperty)

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
			getStringProperty = self.rowFactory.getProperty(containsOptions['name'])
			values = containsOptions['values']
			return RowPropertyContainsChecker(getStringProperty, values)
