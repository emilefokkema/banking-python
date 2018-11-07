var DateConversion = require("./date-conversion.js");
var StringConversion = require("./string-conversion.js");
var makeReadOnly = require("./make-readonly.js");

var RowCollectionProperty = function(data, collection){
	makeReadOnly(this, function(){
		this.collection = collection;
	});
	this.name = data.name;
	this.source = data.source;
	this.conversion = data.conversion && this.createConversion(data.conversion);
};
RowCollectionProperty.prototype = Object.create(RowCollectionProperty.prototype,{
	createConversion:{
		value:function(data){
			if(data.type === "date"){
				return new DateConversion(data);
			}
			return new StringConversion(data);
		}
	},
	remove:{
		value:function(){
			this.collection.removeProperty(this);
		}
	},
	targetType:{
		get:function(){
			if(this.conversion){
				return this.conversion.type;
			}
			return "string";
		},
		set:function(t){
			if(t === "date"){
				var newConversion = new DateConversion({});
				if(this.conversion){
					if(this.conversion.type !== "date"){
						console.log("setting conversion to a date conversion")
						this.conversion = newConversion;
					}
				}else{
					console.log("adding a date conversion");
					this.conversion = newConversion;
				}
			}
			else if(this.conversion && this.conversion.type === "date"){
				console.log("removing a date conversion");
				this.conversion = undefined;
			}
		}
	},
	stringMatch:{
		get:function(){
			if(this.conversion && this.conversion.type === "string"){
				return this.conversion.match;
			}
			return undefined;
		},
		set:function(m){
			if(!m){
				if(this.conversion && this.conversion.type == "string"){
					console.log("removing a string conversion");
					this.conversion = undefined;
				}
				return;
			}
			if(!this.conversion){
				console.log("adding a string conversion");
				this.conversion = new StringConversion({});
			}
			this.conversion.match = m;
		}
	}
});

module.exports = RowCollectionProperty;