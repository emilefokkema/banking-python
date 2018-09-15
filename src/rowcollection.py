from src.printablelist import PrintableList
from datetime import datetime
from src.outputrow import OutputRow, OutputRowPropertyDefinition
from src.rowpropertytype import RowPropertyType
import re

def finddate(_format, string):
	pattern = re.sub(r'%\w','\\\\d+',_format)
	return re.search(pattern, string).group()

def findMatchOrEmpty(pattern, string):
	match = re.search(pattern, string)
	return match.group() if match else ''

class Conversion:
	def __init__(self, sourceType, options):
		self.targetType = options['type']
		self.convert = lambda x:x
		if sourceType == RowPropertyType.STRING:
			if self.targetType == RowPropertyType.DATE.value:
				pattern = options['pattern']
				self.convert = lambda x:datetime.strptime(finddate(pattern, x), pattern)
			if self.targetType == RowPropertyType.STRING.value:
				pattern = options['match']
				self.convert = lambda x:findMatchOrEmpty(pattern, x)
	


class RowCollectionFactory:
	def __init__(self, rowFactory):
		self.rowFactory = rowFactory

	def getDefaultPropertyDefinitions(self):
		return [OutputRowPropertyDefinition(o.name, o.type, (lambda _o:lambda r:_o.getValue(r))(o)) for o in self.rowFactory.properties]

	def getPropertyDefinition(self, options):
		sourceProperty = self.rowFactory.getProperty(options['source'])
		targetValue = lambda r:sourceProperty.getValue(r)
		sourceType = sourceProperty.type
		targetType = sourceType
		if 'conversion' in options:
			conversion = Conversion(sourceType, options['conversion'])
			targetType = conversion.targetType
			targetValue = lambda r:conversion.convert(sourceProperty.getValue(r))
		return OutputRowPropertyDefinition(options['name'], targetType, targetValue)

	def getDefault(self, options):
		displayLimit = options['displayLimit'] if 'displayLimit' in options else -1
		if 'properties' in options:
			properties = [self.getPropertyDefinition(propOptions) for propOptions in options['properties']]
			return OptionableRowCollection(properties, displayLimit)
		if 'default' in options and options['default'] == True:
			return OptionableRowCollection(self.getDefaultPropertyDefinitions(), displayLimit)

class RowCollection:
	def __init__(self, displayLimit=-1):
		self.rows = PrintableList([])
		self.displayLimit = displayLimit
		self.overLimit = 0

	def transformRow(self, row):
		return None

	def addRow(self, row):
		if self.displayLimit >= 0 and len(self.rows) >= self.displayLimit:
			self.overLimit += 1
		else:
			self.rows.append(self.transformRow(row))

	def printSelf(self, printer):
		with printer.indent('items') as printer1:
			self.rows.printSelf(printer1)
		if self.overLimit > 0:
			printer.writeLine('more', self.overLimit)

class OptionableRowCollection(RowCollection):
	def __init__(self, properties, displayLimit):
		super(OptionableRowCollection, self).__init__(displayLimit)
		self.properties = properties

	def transformRow(self, row):
		return OutputRow([prop.getValue(row) for prop in self.properties])
