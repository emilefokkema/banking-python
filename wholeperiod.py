class WholePeriodHandler:

	def getAfBijPrinter(self, afbijCategory, printer):
		if afbijCategory.hasBeginning and afbijCategory.hasEnd:
			return printer.startFile(str(afbijCategory.first.date)+str(afbijCategory.last.date))
		else:
			return printer