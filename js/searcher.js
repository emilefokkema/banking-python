var Searcher = function(){
	this.searchHandlers = [];
	this.stopSearchHandlers = [];
};
Searcher.prototype.onSearch = function(handler){
	this.searchHandlers.push(handler);
};
Searcher.prototype.onStopSearch = function(handler){
	this.stopSearchHandlers.push(handler);
};
Searcher.prototype.search = function(phrase){
	console.log("searching for "+phrase);
	for(var i=0;i<this.searchHandlers.length;i++){
		this.searchHandlers[i](phrase);
	}
};
Searcher.prototype.stopSearch = function(){
	console.log("stopping search");
	for(var i=0;i<this.searchHandlers.length;i++){
		this.stopSearchHandlers[i]();
	}
};
module.exports = Searcher;