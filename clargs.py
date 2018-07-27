class CLArguments:
	def __init__(self, args):
		self.csv = None
		self.json = False
		for arg in args:
			if arg.endswith('.csv'):
				self.csv = arg
			if arg == 'json':
				self.json = True
		if self.csv == None:
			raise Exception('please provide a csv file')
		
