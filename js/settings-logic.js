module.exports = (function(){
	var inherit = function(a,b){a.prototype = Object.create(b.prototype);};
	var defGetFn = function(obj, key, getter){Object.defineProperty(obj, key, {get:getter});}
	var defGet = function(obj, key, value){defGetFn(obj, key, function(){return value;})};

	var RowProperty = function(data){
		this.columnIndex = data.columnIndex;
	};

	var AmountProperty = function(data){
		RowProperty.apply(this,[data]);
	};
	inherit(AmountProperty, RowProperty);
	defGet(AmountProperty.prototype, "type", "amount");

	var DateProperty = function(data){
		RowProperty.apply(this,[data]);
		this.pattern = data.pattern;
	};
	inherit(DateProperty, RowProperty);
	defGet(DateProperty.prototype, "type", "date");

	var DirectionProperty = function(data){
		RowProperty.apply(this,[data]);
		this.incoming = data.incoming;
		this.outgoing = data.outgoing;
	};
	inherit(DirectionProperty, RowProperty);
	defGet(DirectionProperty.prototype, "type", "direction");

	var AdditionalProperty = function(data){
		RowProperty.apply(this,[data]);
		this.name = data.name;
	};
	inherit(AdditionalProperty, RowProperty);
	defGet(AdditionalProperty.prototype, "type", "string");

	var RowDefinition = function(data){
		this.amount = new AmountProperty(data.amount);
		this.date = new DateProperty(data.date);
		this.direction = new DirectionProperty(data.direction);
		this.additional = (data.additional || []).map(function(d){return new AdditionalProperty(d);});
	};
	defGetFn(RowDefinition.prototype, 'definitions', function(){return [this.amount, this.date, this.direction].concat(this.additional);});
	defGetFn(RowDefinition.prototype, 'maxColumnIndex', function(){return Math.max.apply(null, this.definitions.map(function(d){return d.columnIndex;}));});
	RowDefinition.prototype.getNewDefinition = function(index){
		return new AdditionalProperty({name:undefined, columnIndex:index});
	};
	RowDefinition.prototype.getDefinitionAtIndex = function(index){
		return this.definitions.find(function(d){return d.columnIndex == index;});
	};

	var CategorySettings = function(data){
		this.name = data.name;
		this.categories = (data.categories || []).map(function(cd){return new CategorySettings(cd);});
		this.rowCollection = data.rowCollection;
		this.acceptRow = data.acceptRow;
		this.expect = data.expect;
		this.oncePerPeriod = data.oncePerPeriod || false;
	};

	var Settings = function(data){
		this.rowDefinition = new RowDefinition(data.rowDefinition);
		this.categories = {
			incoming: new CategorySettings(data.categories.incoming),
			outgoing: new CategorySettings(data.categories.outgoing)
		};
		this.ignoreFirstLine = data.ignoreFirstLine || false;
	};
	return Settings;
})()