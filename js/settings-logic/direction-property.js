var RowProperty = require("./row-property.js");

var DirectionProperty = function(data){
	RowProperty.apply(this,[data]);
	this.incoming = data.incoming;
	this.outgoing = data.outgoing;
};
DirectionProperty.prototype = Object.create(RowProperty.prototype,{
	type:{
		get:function(){return "direction";}
	}
});
module.exports = DirectionProperty;