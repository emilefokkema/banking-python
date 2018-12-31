import json
from src.customjson import CustomEncoder, CustomDecoder
from src.filterlikegoogle import filterItemLikeGoogle
import os

class ItemSet:
	def __init__(self, dirName, kind):
		self.kind = kind
		self.dirName = dirName + '/' + kind
		if not os.path.isdir(self.dirName):
			os.mkdir(self.dirName)
		self.counterPath = self.dirName + '/counter.json'
		self.counter = 0
		if not os.path.exists(self.counterPath):
			self._writeCounter()
		else:
			with open(self.counterPath, 'r') as file:
				counterObj = json.load(file, cls=CustomDecoder)
				self.counter = counterObj['count']

	def _getFilePath(self, counter):
		return self.dirName + '/' + self.kind + str(counter) + '.json'

	def _writeCounter(self):
		with open(self.counterPath, 'w') as file:
			json.dump({'count':self.counter}, file, cls=CustomEncoder)

	def add(self, item):
		self.counter += 1
		filePath = self._getFilePath(self.counter)
		with open(filePath, 'w') as file:
			json.dump(item, file, cls=CustomEncoder)
		self._writeCounter()

	def _getExistingPaths(self):
		for i in range(1, self.counter + 1):
			filePath = self._getFilePath(i)
			if os.path.exists(filePath):
				yield filePath

	def _getExisting(self):
		result = []
		for filePath in self._getExistingPaths():
			with open(filePath, 'r') as file:
				item = json.load(file, cls=CustomDecoder)
				result.append((filePath, item))
		return result

	def getAll(self, filters, limit):
		result = []
		limit = limit or 0
		resultcount = 0
		for filePath, item in self._getExisting():
			resultcount += 1
			if filterItemLikeGoogle(item, filters) and (limit == 0 or resultcount <= limit):
				result.append(item)
		
		return result

	def remove(self, filters):
		for filePath, item in self._getExisting():
			if filterItemLikeGoogle(item, filters):
				os.remove(filePath)


class DataProvider:
	def __init__(self):
		self.dirname = 'userdata'

	def getPathToKey(self, key):
		return self.dirname+'/'+key+'.json'

	def getItem(self, key):
		path = self.getPathToKey(key)
		if os.path.exists(path):
			with open(path,'r') as file:
				return json.load(file, cls=CustomDecoder)
		return None

	def getItems(self, kind=None, filters=(), limit=None):
		return ItemSet(self.dirname, kind).getAll(filters, limit)

	def removeItems(self, kind=None, filters=()):
		ItemSet(self.dirname, kind).remove(filters)

	def addItem(self, item, kind=None):
		ItemSet(self.dirname, kind).add(item)

	def setItem(self, key, item):
		exists = os.path.isdir(self.dirname)
		if not exists:
			os.mkdir(self.dirname)
		with open(self.getPathToKey(key),'w') as file:
			json.dump(item, file, cls=CustomEncoder, indent=3)

	def deleteItem(self, key):
		os.remove(self.getPathToKey(key))