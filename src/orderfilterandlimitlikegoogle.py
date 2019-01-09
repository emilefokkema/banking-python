from src.filterlikegoogle import filterItemLikeGoogle
from src.orderedlikegoogle import orderedLikeGoogle

def orderFilterAndLimitLikeGoogle(iterable, order=(), filters=(), limit=None):
	ordered = orderedLikeGoogle(iterable, order=order)
	filtered = (item for item in ordered if filterItemLikeGoogle(item, filters))
	limited = (item for index,item in enumerate(filtered) if not limit or index < limit)
	return [item for item in limited]