import json
import os

class DataProvider:
	def getPathToKey(self, key):
		return 'userdata/'+key+'.json'

	def getItem(self, key):
		with open(self.getPathToKey(key),'r') as file:
			return json.load(file)

	def setItem(self, key, item):
		with open(self.getPathToKey(key),'w') as file:
			json.dump(item, file)

	def itemExists(self, key):
		return os.path.exists(self.getPathToKey(key))

	def deleteItem(self, key):
		os.remove(self.getPathToKey(key))