var isDefinition = function(obj){
	for(var p in obj){
		if(obj.hasOwnProperty(p) && p !== "initial" && p !== "get" && p !== "set"){
			return false;
		}
	}
	return obj.hasOwnProperty("initial") && (!!obj.get || !!obj.set);
};

var defineProperty = function(obj, name, value){
	var fieldName = "_" + name;
	var valueIsDefinition = isDefinition(value);
	var initialValue = valueIsDefinition ? value.initial : value;
	Object.defineProperty(obj, fieldName, {value:initialValue,writable:true});
	var getter = function(){return obj[fieldName];}, 
		setter = function(v){obj[fieldName] = v;};
	if(valueIsDefinition){
		if(value.get){
			getter = function(){return value.get.apply(obj, [obj[fieldName]]);};
		}
		if(value.set){
			var oldSetter = setter;
			setter = function(v){value.set.apply(obj, [oldSetter, v]);};
		}
	}
	Object.defineProperty(obj, name, {
		get:getter,
		set:setter,
		configurable:true,
		enumerable:true
	});
};

var defineProperties = function(thisObj, constr){
	var obj = Object.create(null);
	constr.apply(obj);
	for(var p in obj){
		defineProperty(thisObj, p, obj[p]);
	}
};

module.exports = defineProperties;