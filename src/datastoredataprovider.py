class DataStoreDataProvider:
	def __init__(self, datastore_client, user_email):
		self.ancestor_key = datastore_client.key('User', email)