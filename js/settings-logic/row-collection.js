var RowCollectionProperty = require("./row-collection-property.js");
var makeReadOnly = require("./make-readonly.js");

var RowCollection = function(data, onDestroy, rowDefinition){
	var self = this;
	makeReadOnly(this, function(){
		this.rowDefinition = rowDefinition;
		this.onDestroy = onDestroy;
	});
	this.properties = (data.properties || []).map(function(p){return new RowCollectionProperty(p, self);})
};
RowCollection.prototype = Object.create(RowCollection.prototype, {
	addProperty:{
		value:function(){
			var name = this.rowDefinition.additional[0].name;
			this.properties.push(new RowCollectionProperty({name:name,source:name}, this));
		}
	},
	removeProperty:{
		value:function(p){
			var index = this.properties.indexOf(p);
			this.properties.splice(index, 1);
			if(!this.properties.length){
				this.onDestroy();
			}
		}
	}
});
module.exports = RowCollection;

