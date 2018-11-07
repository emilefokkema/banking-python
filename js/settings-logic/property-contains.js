var PropertyContains = function(data){
	this.name = data.name;
	this.values = data.values || [];
};
PropertyContains.prototype = Object.create(PropertyContains.prototype, {
	usesProperty:{
		value:function(prop){return prop.name == this.name;}
	}
});

module.exports = PropertyContains;