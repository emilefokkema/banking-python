from google.cloud import datastore

class DataStoreDataProvider:
	def __init__(self, datastore_client, user_email):
		self.datastore_client = datastore_client
		self.ancestor_key = datastore_client.key('User', user_email)

	def _getKind(self, key):
		if key == 'settings':
			return 'settings'
		if key == 'history':
			return 'history'
		return 'thing'

	def _getItemKey(self, key):
		return self.datastore_client.key(self._getKind(key), key, parent=self.ancestor_key)

	def getItem(self, key):
		itemKey = self._getItemKey(key)
		result = self.datastore_client.get(itemKey)
		return result

	def getItems(self, kind=None, filters=(), limit=None, order=()):
		query = self.datastore_client.query(kind=kind, order=order, ancestor=self.ancestor_key)
		for _filter in filters:
			query.add_filter(*_filter)
		return query.fetch(limit=limit)

	def removeItems(self, kind=None, filters=()):
		for item in [*self.getItems(kind, filters)]:
			self.datastore_client.delete(item.key)

	def addItem(self, item, kind=None):
		key = self.datastore_client.key(kind, parent=self.ancestor_key)
		entity = datastore.Entity(key=key)
		entity.update(item)
		self.datastore_client.put(entity)

	def setItem(self, key, item):
		itemKey = self._getItemKey(key)
		entity = datastore.Entity(key=itemKey)
		try:
			entity.update(item)
		except ValueError:
			print('error while updating with: ',repr(item))
			raise
		self.datastore_client.put(entity)

	def deleteItem(self, key):
		itemKey = self._getItemKey(key)
		self.datastore_client.delete(itemKey)