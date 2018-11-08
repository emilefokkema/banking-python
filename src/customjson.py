import json
from datetime import datetime
import re

date_format_pattern = r'%d-%m-%Y %H:%M'
date_pattern = re.compile(r'^\d{2}-\d{2}-\d{4} \d{2}:\d{2}$')

class CustomEncoder(json.JSONEncoder):
	def default(self, o):
		if isinstance(o, datetime):
			return o.strftime(date_format_pattern)
		return json.JSONEncoder.default(self, o)

class CustomDecoder(json.JSONDecoder):
	def __init__(self, *args, **kwargs):
		json.JSONDecoder.__init__(self, object_pairs_hook=self.object_pairs_hook, *args, **kwargs)

	def object_pairs_hook(self, pairs):
		result = {}
		for pair in pairs:
			result[pair[0]] = self.checkValue(pair[1])
		return result

	def checkValue(self, value):
		if isinstance(value, str) and date_pattern.search(value):
			return datetime.strptime(value, date_format_pattern)
		return value