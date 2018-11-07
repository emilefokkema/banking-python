var PropertyMatches = function(data){
	this.name = data.name;
	this.pattern = data.pattern;
};
PropertyMatches.prototype = Object.create(PropertyMatches.prototype, {
	usesProperty:{
		value:function(prop){return prop.name == this.name;}
	}
});

module.exports = PropertyMatches;