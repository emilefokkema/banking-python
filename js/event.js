var event = function(){
	var handlers = [];
	var invoke = function(){
		for(var i=0;i<handlers.length;i++){
			handlers[i].apply(null,arguments);
		}
	};
	invoke.handlers = handlers;
	var callee = arguments.callee;
	for(var p in callee){
		if(callee.hasOwnProperty(p)){
			invoke[p] = callee[p];
		}
	}
	return invoke;
};
event.add = function(handler){
	this.handlers.push(handler);
};
module.exports = event;