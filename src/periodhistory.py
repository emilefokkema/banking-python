from src.jsonprinter import printJson
from src.periodfile import PeriodFile
from src.printablelist import PrintableList

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
		items = [*self.dataProvider.getItems(kind='historyitem')]
		items.sort(key=lambda i:i['date'])
		fileNames = (entry['fileName'] for entry in items)
		result = [PeriodFile.fromPeriodObj(fileName, self.dataProvider.getItem(fileName)) for fileName in fileNames]

		return printJson(PrintableList(result))