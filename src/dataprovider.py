import json
from src.customjson import CustomEncoder, CustomDecoder
import os

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

	def setItem(self, key, item):
		exists = os.path.isdir(self.dirname)
		if not exists:
			os.mkdir(self.dirname)
		with open(self.getPathToKey(key),'w') as file:
			json.dump(item, file, cls=CustomEncoder, indent=3)

	def deleteItem(self, key):
		os.remove(self.getPathToKey(key))