from src.jsonprinter import printJson
from src.periodfile import PeriodFile
from src.printablelist import PrintableList

class PeriodHistory:
	historyKey = 'history'

	def __init__(self, dataProvider):
		self.dataProvider = dataProvider

	def getHistory(self):
		history = self.dataProvider.getItem(self.historyKey)
		return {'entries':[]} if not history else history

	def addItem(self, period):
		history = self.getHistory()
		fileName = period.makeFileName()
		date = period.getFrom()
		file = printJson(period)
		if self.index(history, fileName) == -1:
			history['entries'].append({'fileName':fileName,'date':date})
		self.dataProvider.setItem(self.historyKey, history)
		self.dataProvider.setItem(fileName, file)

	def index(self, history, fileName):
		for index, entry in enumerate(history['entries']):
			if entry['fileName'] == fileName:
				return index;
		return -1

	def removeItem(self, key):
		history = self.getHistory()
		index = self.index(history, key)
		if index > -1:
			history['entries'].pop(index)
			self.dataProvider.deleteItem(key)
		if len(history['entries']) == 0:
			self.dataProvider.deleteItem(self.historyKey)
		else:
			self.dataProvider.setItem(self.historyKey, history)

	def getAll(self):
		history = self.getHistory()
		fileNames = (entry['fileName'] for entry in history['entries'])
		result = [PeriodFile.fromPeriodObj(fileName, self.dataProvider.getItem(fileName)) for fileName in fileNames]
		return printJson(PrintableList(result))