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