class CLArguments:
	def __init__(self, args):
		for arg in args:
			if arg.endswith('.csv'):
				self.csv = arg
				return
		raise Exception('please provide a csv file')
