var AmountProperty = require("./amount-property.js");
var DateProperty = require("./date-property.js");
var DirectionProperty = require("./direction-property.js");
var AdditionalProperty = require("./additional-property.js");
var makeReadOnly = require("./make-readonly.js");

var RowDefinition = function(data, settings){
	var self = this;
	makeReadOnly(this, function(){
		this.settings = settings;
	});
	this.amount = new AmountProperty(data.amount);
	this.date = new DateProperty(data.date);
	this.direction = new DirectionProperty(data.direction);
	this.additional = (data.additional || []).map(function(d){return new AdditionalProperty(d, settings, self);});
};
Object.defineProperties(RowDefinition.prototype, {
	definitions:{
		get:function(){return [this.amount, this.date, this.direction].concat(this.additional);}
	},
	maxColumnIndex:{
		get:function(){return Math.max.apply(null, this.definitions.map(function(d){return d.columnIndex;}));}
	},
	getNewDefinition:{
		value:function(index){
			return new AdditionalProperty({name:undefined, columnIndex:index}, this.settings, this);
		}
	},
	getDefinitionAtIndex:{
		value:function(index){
			return this.definitions.find(function(d){return d.columnIndex == index;});
		}
	},
	addDefinition:{
		value:function(d){
			if(this.additional.indexOf(d) > -1){
				return;
			}
			for(var i=0;i<this.additional.length;i++){
				if(this.additional[i].name == d.name){
					this.additional.splice(i, 1);
					break;
				}
			}
			this.additional.push(d);
		}
	},
	removeDefinition:{
		value:function(d){
			var index = this.additional.indexOf(d);
			if(index > -1){
				this.additional.splice(index, 1);
			}
		}
	}
});

module.exports = RowDefinition;