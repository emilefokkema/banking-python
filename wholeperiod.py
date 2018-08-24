import os
import re
import json
class WholePeriodHandler:

	def isPeriodFileName(self, name):
		return not re.search('^\d{4}-\d{2}-\d{6}-\d{2}-\d{2}\.json$',name) == None

	def makePeriodFileName(self, afbijCategory):
		return afbijCategory.first['date'].strftime(r'%Y-%m-%d')+afbijCategory.last['date'].strftime(r'%Y-%m-%d')

	def getAfBijPrinter(self, afbijCategory, printer):
		if afbijCategory.hasBeginning and afbijCategory.hasEnd:
			return printer.startFile(self.makePeriodFileName(afbijCategory))
		else:
			return printer

	def makeEntryForFile(self, fileName):
		fileObj = None
		with open(fileName, 'r') as jsonFile:
			fileObj = json.load(jsonFile)
		return {"fileName":fileName,"file":fileObj}

	def findPeriodFiles(self):
		result = []
		files = [f for f in os.listdir('.') if os.path.isfile(f) and self.isPeriodFileName(f)]
		for file in files:
			result.append(self.makeEntryForFile(file))
		return result