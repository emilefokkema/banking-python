class DomainException(Exception):
	def __init__(self, message):
		super(DomainException, self).__init__(message)
		self.message = message