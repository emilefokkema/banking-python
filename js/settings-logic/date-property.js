var RowProperty = require("./row-property.js");

var DateProperty = function(data){
	RowProperty.apply(this,[data]);
	this.pattern = data.pattern;
};
DateProperty.prototype = Object.create(RowProperty.prototype,{
	type:{
		get:function(){return "date";}
	}
});
module.exports = DateProperty;