from src.jsonprinter import printJson
from src.periodfile import PeriodFile
from src.printablelist import PrintableList

numberOfItemsAtATime = 3

def last(_list, number):
	length = len(_list)
	return [item for index,item in enumerate(_list) if index >= length - number]

class HistoryEntry:
	def __init__(self, period):
		self.fileName = period.makeFileName()
		self.date = period.getFrom()

	def printSelf(self, printer):
		printer.writeLine('fileName', self.fileName)
		printer.writeLine('date', self.date)

class PeriodHistory:
	historyKey = 'history'

	def __init__(self, dataProvider):
		self.dataProvider = dataProvider

	def addItem(self, period):
		entry = HistoryEntry(period)
		file = printJson(period)
		fileName = entry.fileName
		self._removeHistoryItem(fileName)
		self.dataProvider.addItem(printJson(entry), kind='historyitem')
		self.dataProvider.setItem(fileName, file)

	def _removeHistoryItem(self, fileName):
		self.dataProvider.removeItems(kind='historyitem',filters=(('fileName','=',fileName),))

	def removeItem(self, key):
		self._removeHistoryItem(key)
		self.dataProvider.deleteItem(key)

	def getAll(self):
		items = list(self.dataProvider.getItems(kind='historyitem', order=('-date',), limit=numberOfItemsAtATime + 1))
		items.sort(key=lambda i:i['date'])
		isMore = len(items) > numberOfItemsAtATime
		result = last([{'fileName':entry['fileName']} for entry in items], numberOfItemsAtATime)

		return {'isMore':isMore,'items':result}