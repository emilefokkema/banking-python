import json
from src.customjson import CustomEncoder
import traceback

def wraps(wrapper):
    def newWrapper(f):
        wrap = wrapper(f)
        wrap.__name__ = f.__name__
        return wrap
    return newWrapper

@wraps
def returnsJson(f):
    def wrap(*args, **kwargs):
        result = f(*args, **kwargs)
        rest = []
        tupleReturned = isinstance(result, tuple)
        if tupleReturned:
            (result, *rest) = result
        result = json.dumps(result, cls=CustomEncoder)
        if tupleReturned:
            return tuple([result] + rest)
        else:
            return result
    return wrap

@wraps
def catchesException(f):
    def wrap(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as exc:
            traceback.print_exc()
            return str(exc), 500
    return wrap