var SearchContext = function(){
	this.results = [];
};
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
	var context = new SearchContext();
	console.log("searching for "+phrase);
	for(var i=0;i<this.searchHandlers.length;i++){
		this.searchHandlers[i](context, phrase);
	}
};
Searcher.prototype.stopSearch = function(){
	console.log("stopping search");
	for(var i=0;i<this.stopSearchHandlers.length;i++){
		this.stopSearchHandlers[i]();
	}
};
module.exports = Searcher;