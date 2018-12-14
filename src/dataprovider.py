import json
from src.customjson import CustomEncoder, CustomDecoder
import os

class ItemSet:
	def __init__(self, dirName, kind):
		self.kind = kind
		self.dirName = dirname + '/' + kind
		if not os.path.isdir(self.dirName):
			os.mkdir(self.dirName)
		self.counterPath = self.dirname + '/counter.json'
		self.counter = 0
		if not os.path.exists(self.counterPath):
			with open(self.counterPath, 'w') as file:
				json.dump({'count':self.counter}, file, cls=CustomEncoder)
		else:
			with open(self.counterPath, 'r') as file:
				counterObj = json.load(file, cls=CustomDecoder)
				self.counter = counterObj['count']

	def _getFilePath(self, counter):
		return self.dirName + '/' + self.kind + str(counter) + '.json'

	def add(self, item):
		self.counter += 1
		filePath = self._getFilePath(self.counter)
		with open(filePath, 'w') as file:
			json.dump(item, file, cls=CustomEncoder)

	def getAll(self, filters):
		result = []
		for i in range(1, self.counter + 1):
			filePath = self._getFilePath(i)
			if os.path.exists(filePath):
				with open(filePath, 'r') as file:
					result.append(json.load(file, cls=CustomDecoder))
		return result


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

	def getItems(self, kind=None, filters=()):
		return ItemSet(self.dirname, kind).getAll(filters)

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