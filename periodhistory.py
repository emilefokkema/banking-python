class PeriodHistory:
	historyKey = 'history'

	def __init__(self, dataProvider):
		self.dataProvider = dataProvider

	def getHistory(self):
		if self.dataProvider.itemExists(self.historyKey):
			return self.dataProvider.getItem(self.historyKey)
		return []

	def addItem(self, key, file):
		history = self.getHistory()
		if not key in history:
			history.append(key)
		self.dataProvider.setItem(self.historyKey, history)
		self.dataProvider.setItem(key, file)

	def removeItem(self, key):
		history = self.getHistory()
		if key in history:
			history.remove(key)
			self.dataProvider.deleteItem(key)
		if len(history) == 0:
			self.dataProvider.deleteItem(self.historyKey)
		else:
			self.dataProvider.setItem(self.historyKey, history)

	def getAll(self):
		result = []
		history = self.getHistory()
		for key in history:
			result.append({
				'fileName':key,
				'file':self.dataProvider.getItem(key)
			})
		return result