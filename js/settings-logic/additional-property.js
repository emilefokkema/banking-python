var RowProperty = require("./row-property.js");
var makeReadOnly = require("./make-readonly.js");
var defineProperties = require("./define-properties.js");

var AdditionalProperty = function(data, settings, rowDefinition){
	RowProperty.apply(this,[data]);
	makeReadOnly(this, function(){
		this.settings = settings;
		this.rowDefinition = rowDefinition;
	});
	defineProperties(this, function(){
		this.name = {
			initial:data.name,
			set:function(set, v){
				if(v === "date" || v === "amount" || v === "direction"){
					throw new Error("\""+v+"\" is a reserved name. Please don't use it for a column.")
				}
				set(v);
				if(v){
					this.add();
				}else{
					this.remove();
				}
			}
		};
	});
};
AdditionalProperty.prototype = Object.create(RowProperty.prototype,{
	type:{
		get:function(){return "string";}
	},
	inUse:{
		get:function(){return this.settings.usesProperty(this);}
	},
	add:{
		value:function(){this.rowDefinition.addDefinition(this);}
	},
	remove:{
		value:function(){this.rowDefinition.removeDefinition(this);}
	}
});
module.exports = AdditionalProperty;