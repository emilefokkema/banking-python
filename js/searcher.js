var SearchContext = function(){
	this.results = [];
};
SearchContext.prototype.addResult = function(result){
	console.log("adding search result");
	this.results.push(result);
};
var Searcher = function(){
	this.searchHandlers = [];
	this.stopSearchHandlers = [];
	this.currentContext = null;
};
Searcher.prototype.onSearch = function(handler){
	this.searchHandlers.push(handler);
};
Searcher.prototype.onStopSearch = function(handler){
	this.stopSearchHandlers.push(handler);
};
Searcher.prototype.search = function(phrase){
	this.currentContext = new SearchContext();
	for(var i=0;i<this.searchHandlers.length;i++){
		this.searchHandlers[i](this.currentContext, phrase);
	}
};
Searcher.prototype.stopSearch = function(){
	console.log("stopping search");
	for(var i=0;i<this.stopSearchHandlers.length;i++){
		this.stopSearchHandlers[i]();
	}
	this.currentContext = null;
};
module.exports = Searcher;