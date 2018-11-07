var RowProperty = require("./row-property.js");

var AmountProperty = function(data){
	RowProperty.apply(this,[data]);
};
AmountProperty.prototype = Object.create(RowProperty.prototype,{
	type:{
		get:function(){return "amount";}
	}
});
module.exports = AmountProperty;