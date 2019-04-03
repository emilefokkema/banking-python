var event = require("./event.js")

var SearchContext = function(searchPhrase){
	this.searchPhrase = searchPhrase;
	this.searchPattern = searchPhrase.replace(/[-$()*+.\/?[\\\]^{|}]/g, '\\$&');
	this.replacePattern = "("+this.searchPattern+")|((?:(?!"+this.searchPattern+").)+)";
	this.currentPosition = -1;
	this.results = [];
};
SearchContext.prototype.showCurrent = function(){
	this.results[this.currentPosition].show();
};
SearchContext.prototype.blurCurrentIfAny = function(){
	if(this.currentPosition == -1){
		return;
	}
	this.results[this.currentPosition].blur();
};
SearchContext.prototype.addResult = function(result){
	this.results.push(result);
};
SearchContext.prototype.moveUp = function(){
	this.blurCurrentIfAny();
	this.currentPosition = Math.max(0, this.currentPosition - 1);
	this.showCurrent();
};
SearchContext.prototype.dispose = function(){
	for(var i=0;i<this.results.length;i++){
		this.results[i].forget();
	}
};
SearchContext.prototype.moveDown = function(){
	this.blurCurrentIfAny();
	this.currentPosition = Math.min(this.results.length - 1, this.currentPosition + 1);
	this.showCurrent();
};
SearchContext.prototype.matches = function(text){
	return text.toLowerCase().indexOf(this.searchPhrase) > -1;
};
SearchContext.prototype.subdivide = function(text){
	var result = [];
	text.replace(new RegExp(this.replacePattern, "ig"), function(match, foundGroup, notFoundGroup){
		if(foundGroup){
			result.push({
				match:true,
				text:match
			});
		}else{
			result.push({
				match:false,
				text:match
			});
		}
	});
	return result;
};

var Searcher = function(){
	this.onSearch = event();
	this.onStopSearch = event();
	this.onResult = event();
	this.onNoResult = event();
	this.currentContext = null;
};
Searcher.prototype.search = function(phrase){
	this.currentContext && this.currentContext.dispose();
	this.currentContext = new SearchContext(phrase);
	this.onSearch(this.currentContext);
	if(this.currentContext.results.length > 0){
		this.onResult(this.currentContext);
	}else{
		this.onNoResult();
	}
};
Searcher.prototype.stopSearch = function(){
	this.onStopSearch();
	this.currentContext && this.currentContext.dispose();
	this.currentContext = null;
};
module.exports = Searcher;