import json
import os

class DataProvider:
	def getPathToKey(self, key):
		return 'userdata/'+key+'.json'

	def getItem(self, key):
		path = self.getPathToKey(key)
		if os.path.exists(path):
			with open(path,'r') as file:
				return json.load(file)
		return None

	def setItem(self, key, item):
		with open(self.getPathToKey(key),'w') as file:
			json.dump(item, file)

	def deleteItem(self, key):
		os.remove(self.getPathToKey(key))