from src.jsonprinter import PrintableDict

class PeriodFile:
	def __init__(self, fileName, period):
		self.period = period
		self.fileName = fileName

	@classmethod
	def fromPeriod(cls, period):
		return cls(period.makeFileName(), period)

	@classmethod
	def fromPeriodObj(cls, fileName, periodObj):
		return cls(fileName, PrintableDict(periodObj))

	def printSelf(self, printer):
		printer.writeLine('fileName', self.fileName)
		with printer.indent('file') as printer1:
			self.period.printSelf(printer1)