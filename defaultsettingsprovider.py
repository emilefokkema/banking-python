class DefaultSettingsProvider:

	def getDefaultSettings(self):
		return {
			'rowDefinition':{
				'amount':{
					'columnIndex':2
				},
				'date':{
					'columnIndex':0,
					'pattern':'yyyymmdd'
				},
				'direction':{
					'columnIndex':1,
					'incoming':'Credit',
					'outgoing':'Debit'
				},
				'additional':[
				]
			},
			'categories':{
				'outgoing':{
					'name':'Debit',
					'categories':[
					]
				},
				'incoming':{
					'name':'Credit',
					'categories':[
					]
				}
			},
			'ignoreFirstLine':True
		}