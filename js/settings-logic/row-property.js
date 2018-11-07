var RowProperty = function(data){
	this.columnIndex = data.columnIndex;
};
RowProperty.prototype.switchPositionsWith = function(p){
	var thisIndex = this.columnIndex;
	this.columnIndex = p.columnIndex;
	p.columnIndex = thisIndex;
};
module.exports = RowProperty;