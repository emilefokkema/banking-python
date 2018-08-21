from datetime import date
import re

class DatePart:
	def __init__(self, symbol):
		self.pattern = symbol+'+'
		self.groupIndex = -1

	def getExpression(self, match):
		return int(match.group(self.groupIndex))

	def correspondsToPatternPart(self, match):
		return not re.search(self.pattern, match) == None

class DatePattern:
	def __init__(self, pattern):
		self.yearPart = DatePart('y')
		self.monthPart = DatePart('m')
		self.dayPart = DatePart('d')
		self.pattern = self.makePattern(pattern, [self.yearPart, self.monthPart, self.dayPart])

	def makePattern(self, pattern, parts):
		groupIndex = 0
		def replF(match):
			nonlocal groupIndex
			groupIndex += 1
			matchString = match.group()
			for part in parts:
				if part.correspondsToPatternPart(matchString):
					part.groupIndex = groupIndex
					break
			return r'(\d{' + str(len(matchString)) + '})'
		return re.sub('(?:'+'|'.join([x.pattern for x in parts])+')', replF, pattern)

	def parse(self, s):
		match = re.search(self.pattern, s)
		return date(self.yearPart.getExpression(match), self.monthPart.getExpression(match), self.dayPart.getExpression(match))