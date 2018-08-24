import json
import os

class DataProvider:

	def getItem(self, key):
		with open(key+'.json','r') as file:
			return json.load(file)

	def setItem(self, key, item):
		with open(key+'.json','w') as file:
			json.dump(item, file)

	def itemExists(self, key):
		return os.path.exists(key+'.json')

	def deleteItem(self, key):
		os.remove(key+'.json')