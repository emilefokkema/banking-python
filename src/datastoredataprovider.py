class DataStoreDataProvider:
	def __init__(self, datastore_client, user_email):
		self.datastore_client = datastore_client
		self.ancestor_key = datastore_client.key('User', user_email)

	def _getKind(self, key):
		if key == 'settings':
			return 'settings'
		return 'thing'

	def getItem(self, key):
		itemKey = self.datastore_client.key(self._getKind(key), key, ancestor=self.ancestor_key)
		result = self.datastore_client.get(itemKey)
		return result