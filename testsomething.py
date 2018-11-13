from src.jsonprinter import printJson

def jsonproperty(name, getvalue):
	def classWrapper(cls):
		class newclass(cls):
			def printSelf(self, printer):
				printer.writeLine(name, getvalue(self))
				superObj = super(newclass, self)
				if hasattr(superObj,'printSelf'):
					superObj.printSelf(printer)
		return newclass
	return classWrapper

@jsonproperty('a', lambda x:x.a)
@jsonproperty('b', lambda x:x.b)
class A:
	def __init__(self):
		self.a = 7
		self.b = B()

@jsonproperty('a', lambda x:x.a)
@jsonproperty('b', lambda x:x.b)
class B:
	def __init__(self):
		self.a = 1
		self.b = 2

a = A()
print(repr(printJson(a)))