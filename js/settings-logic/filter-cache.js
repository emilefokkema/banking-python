var PropertyContains = require("./property-contains.js");
var PropertyMatches = require("./property-matches.js");

var FilterCache = function(rowDefinition){
	this.propertyContains = undefined;
	this.propertyMatches = undefined;
	this.latest = undefined;
	this.rowDefinition = rowDefinition;
};
FilterCache.prototype = Object.create(FilterCache.prototype, {
	getPropertyContains:{
		value:function(){
			return this.propertyContains || (this.propertyContains = this.createPropertyContains());
		}
	},
	createPropertyContains:{
		value:function(){
			var name = (this.latest && this.latest.name) || this.rowDefinition.additional[0].name;
			return new PropertyContains({name:name});
		}
	},
	getPropertyMatches:{
		value:function(){
			return this.propertyMatches || (this.propertyMatches = this.createPropertyMatches());
		}
	},
	createPropertyMatches:{
		value:function(){
			var name = (this.latest && this.latest.name) || this.rowDefinition.additional[0].name;
			return new PropertyMatches({name:name});
		}
	},
	save:{
		value:function(acceptRow){
			this.propertyContains = acceptRow.propertyContains || this.propertyContains;
			this.propertyMatches = acceptRow.propertyMatches || this.propertyMatches;
			this.latest = acceptRow.propertyMatches || acceptRow.propertyContains;
		}
	},
	getFilter:{
		value:function(){
			return this.latest || this.createPropertyContains();
		}
	}
});

module.exports = FilterCache;