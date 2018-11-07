module.exports = function(thisObj, constr){
	var obj = Object.create(null);
	constr.apply(obj);
	for(var p in obj){
		Object.defineProperty(thisObj, p, {value:obj[p],writable:false,configurable:false,enumerable:false});
	}
};