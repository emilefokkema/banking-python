module.exports = (function(){
	var RowDefinition = function(data){
		this.amount = data.amount;
		this.date = data.date;
		this.direction = data.direction;
		this.additional = data.additional || [];
	};
	var Settings = function(data){
		this.rowDefinition = new RowDefinition(data.rowDefinition);
		this.categories = data.categories;
		this.ignoreFirstLine = data.ignoreFirstLine || false;
	};
	return Settings;
})()