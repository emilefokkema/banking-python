class PeriodHistory:
	historyKey = 'history'

	def __init__(self, dataProvider):
		self.dataProvider = dataProvider

	def getHistory(self):
		history = self.dataProvider.getItem(self.historyKey)
		return {'entries':[]} if not history else history

	def addItem(self, key, file):
		history = self.getHistory()
		if not key in history['entries']:
			history['entries'].append(key)
		self.dataProvider.setItem(self.historyKey, history)
		self.dataProvider.setItem(key, file)

	def removeItem(self, key):
		history = self.getHistory()
		if key in history['entries']:
			history['entries'].remove(key)
			self.dataProvider.deleteItem(key)
		if len(history['entries']) == 0:
			self.dataProvider.deleteItem(self.historyKey)
		else:
			self.dataProvider.setItem(self.historyKey, history)

	def getAll(self):
		result = []
		history = self.getHistory()
		for key in history['entries']:
			result.append({
				'fileName':key,
				'file':self.dataProvider.getItem(key)
			})
		return result