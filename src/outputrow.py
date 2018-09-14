class OutputRowPropertyDefinition:
	def __init__(self, name, _type, valueGetter):
		self.name = name
		self.type = _type
		self.valueGetter = valueGetter

	def getValue(self, row):
		return OutputRowPropertyValue(self, self.valueGetter(row))

class OutputRowPropertyValue:
	def __init__(self, _property, value):
		self.property = _property
		self.value = value

	def printSelf(self, printer):
		printer.writeLine('name', self.property.name)
		printer.writeLine('value', self.value)
		printer.writeLine('type', self.property.type)

class OutputRow:
	def __init__(self, propertyValues):
		self.propertyValues = propertyValues

	def printSelf(self, printer):
		with printer.indent('properties') as printer1:
			with printer1.startList() as listPrinter:
				for propertyValue in self.propertyValues:
					with listPrinter.indentItem() as itemprinter:
						propertyValue.printSelf(itemprinter)