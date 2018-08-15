class PrintableList:
	def __init__(self, initial):
		self.items = initial

	def __len__(self):
		return len(self.items)

	def __iter__(self):
		return iter(self.items)

	def append(self, obj):
		self.items.append(obj)

	def printSelf(self, printer):
		with printer.startList() as printer1:
			for item in self.items:
				with printer1.indentItem() as printer2:
					item.printSelf(printer2)