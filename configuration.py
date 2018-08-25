from domainexception import DomainException

class Configuration:
	def __init__(self, dataProvider):
		self.dataProvider = dataProvider

	def getRowDefinition(self):
		if not self.dataProvider.itemExists('row-definition'):
			raise DomainException('Please provide a row definition before processing a csv')
		return self.dataProvider.getItem('row-definition')

	def getCategories(self):
		if not self.dataProvider.itemExists('categories'):
			raise DomainException('Please provide categories before processing a csv')
		return self.getExtendedCategoriesDefinition(self.dataProvider.getItem('categories'))

	def getExtendedCategoriesDefinition(self, categoriesDefinition):
		incomingOptions = categoriesDefinition['incoming']
		outgoingOptions = categoriesDefinition['outgoing']
		return {
			'categories':[
				{
					'name':outgoingOptions['name'],
					'acceptRow': {'outgoing':True},
					'categories':outgoingOptions['categories'] + [{'name':'leftovers','rowCollection':{'displayLimit':5,'default':True}}]
				},
				{
					'name':incomingOptions['name'],
					'acceptRow':{'incoming':True},
					'categories':incomingOptions['categories'] + [{'name':'leftovers','rowCollection':{'displayLimit':5,'default':True}}]
				}
			]
		}