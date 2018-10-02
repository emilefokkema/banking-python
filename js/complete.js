module.exports = (function(){
	var Complete = function(parent){
		Object.defineProperty(this, 'parent', {value:parent});
		Object.defineProperty(this, 'incompletes', {value:[]});
	};
	Complete.prototype.onComplete = function(completeCallback){
		this.completeCallback = completeCallback;
	};
	Complete.prototype.onIncomplete = function(incompleteCallback){
		this.incompleteCallback = incompleteCallback;
	};
	Complete.prototype.returnIncomplete = function(incomplete){
		var index = this.incompletes.indexOf(incomplete);
		if(index == -1){
			return;
		}
		this.incompletes.splice(index, 1);
		if(this.isComplete()){
			this.complete();
		}
	};
	Complete.prototype.getIncomplete = function(){
		var incomplete = new Complete(this);
		this.incompletes.push(incomplete);
		this.incompleteCallback && this.incompleteCallback();
		return incomplete;
	};
	Complete.prototype.complete = function(){
		if(this.incompletes.length > 0){
			console.error("can't complete before all incompletes are complete");
		}
		this.completeCallback && this.completeCallback();
		this.parent && this.parent.returnIncomplete(this);
	};
	Complete.prototype.isComplete = function(){
		return this.incompletes.length == 0;
	};
	return Complete;
})();