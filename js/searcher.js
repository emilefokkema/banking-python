var event = require("./event.js")

var SearchContext = function(){
	this.currentPosition = -1;
	this.results = [];
};
SearchContext.prototype.addResult = function(result){
	this.results.push(result);
};
var Searcher = function(){
	this.onSearch = event();
	this.onStopSearch = event();
	this.onResult = event();
	this.onNoResult = event();
	this.currentContext = null;
};
Searcher.prototype.search = function(phrase){
	this.currentContext = new SearchContext();
	this.onSearch(this.currentContext, phrase);
	if(this.currentContext.results.length > 0){
		this.onResult(this.currentContext);
	}else{
		this.onNoResult();
	}
};
Searcher.prototype.stopSearch = function(){
	this.onStopSearch();
	this.currentContext = null;
};
module.exports = Searcher;