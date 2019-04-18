var throttle = function(f, timeout){
	var args, thisArg;
	var currentTimeout = undefined;
	return function(){
		args = Array.prototype.slice.apply(arguments);
		thisArg = this;
		if(currentTimeout !== undefined){
			clearTimeout(currentTimeout);
		}
		currentTimeout = setTimeout(function(){
			f.apply(thisArg, args);
			currentTimeout = undefined;
		}, timeout);
	};
};

module.exports = throttle;