from domainexception import DomainException

class Configuration:
	def __init__(self, dataProvider):
		self.dataProvider = dataProvider

	def getRowDefinition(self):
		return self.dataProvider.getItem('row-definition')

	def getCategories(self):
		categoriesDefinition = self.getCategoryConfiguration()
		return None if categoriesDefinition == None else self.getExtendedCategoriesDefinition(categoriesDefinition)

	def getCategoryConfiguration(self):
		return self.dataProvider.getItem('categories')

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