def filterLikeGoogle(property_name, operator, value):
	def filterItem(item):
		if not property_name in item:
			return False
		actualValue = item[property_name]
		return operator == '=' and actualValue == value or \
				operator == '>' and actualValue > value or \
				operator == '>=' and actualValue >= value or \
				operator == '<' and actualValue < value or \
				operator == '<=' and actualValue <= value
	return filterItem

def filterItemLikeGoogle(item, filters=()):
	return all((filterLikeGoogle(*filter)(item) for filter in filters))
