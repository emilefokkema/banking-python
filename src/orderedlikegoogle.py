import re

orderArgPattern = r'^(-)?(.*)$'

def getKeyAndDescending(orderarg):
	match = re.search(orderArgPattern, orderarg)
	key = lambda o:o[match.group(2)]
	descending = bool(match.group(1))
	return key, descending

def orderedLikeGoogle(iterable, order=()):
	result = list(iterable)
	keysAndDescending = [getKeyAndDescending(orderarg) for orderarg in order]
	keysAndDescending.reverse()
	for key, descending in keysAndDescending:
		result = sorted(result, key=key, reverse=descending)
	return result
