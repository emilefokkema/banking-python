var PropertyContains = require("./property-contains.js");
var PropertyMatches = require("./property-matches.js");

var AcceptRow = function(data){
	if(data.propertyContains){
		this.propertyContains = new PropertyContains(data.propertyContains);
	}
	if(data.propertyMatches){
		this.propertyMatches = new PropertyMatches(data.propertyMatches);
	}
	if(data instanceof PropertyContains){
		this.propertyContains = data;
	}
	if(data instanceof PropertyMatches){
		this.propertyMatches = data;
	}
};
AcceptRow.prototype = Object.create(AcceptRow.prototype, {
	usesProperty:{
		value:function(prop){
			return (this.propertyContains && this.propertyContains.usesProperty(prop)) || (this.propertyMatches && this.propertyMatches.usesProperty(prop));
		}
	}
});

module.exports = AcceptRow;