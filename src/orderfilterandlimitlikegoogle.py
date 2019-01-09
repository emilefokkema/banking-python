from src.filterlikegoogle import filterItemLikeGoogle
from src.orderedlikegoogle import orderedLikeGoogle

def orderFilterAndLimitLikeGoogle(iterable, order=(), filters=(), limit=None):
	ordered = orderedLikeGoogle(iterable, order=order)
	result = []
	limit = limit or 0
	resultcount = 0
	for item in ordered:
		resultcount += 1
		if filterItemLikeGoogle(item, filters) and (limit == 0 or resultcount <= limit):
			result.append(item)
	
	return result