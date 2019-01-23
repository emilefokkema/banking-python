var event = require("./event.js")

var SearchContext = function(){
	this.currentPosition = -1;
	this.results = [];
};
SearchContext.prototype.showCurrent = function(){
	this.results[this.currentPosition].show();
};
SearchContext.prototype.addResult = function(result){
	this.results.push(result);
};
SearchContext.prototype.moveUp = function(){
	this.currentPosition = Math.max(0, this.currentPosition - 1);
	this.showCurrent();
};
SearchContext.prototype.moveDown = function(){
	this.currentPosition = Math.min(this.results.length - 1, this.currentPosition + 1);
	this.showCurrent();
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