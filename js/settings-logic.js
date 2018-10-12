var TreeNode = require("./treenode.js");

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

	var PropertyContains = function(data){
		this.name = data.name;
		this.values = data.values;
	};
	PropertyContains.prototype = Object.create(PropertyContains.prototype, {
		usesProperty:{
			value:function(prop){return prop.name == this.name;}
		}
	});

	var PropertyMatches = function(data){
		this.name = data.name;
		this.pattern = data.pattern;
	};
	PropertyMatches.prototype = Object.create(PropertyMatches.prototype, {
		usesProperty:{
			value:function(prop){return prop.name == this.name;}
		}
	});

	var AcceptRow = function(data){
		if(data.propertyContains){
			this.propertyContains = new PropertyContains(data.propertyContains);
		}
		if(data.propertyMatches){
			this.propertyMatches = new PropertyMatches(data.propertyMatches);
		}
	};
	AcceptRow.prototype = Object.create(AcceptRow.prototype, {
		usesProperty:{
			value:function(prop){
				return (this.propertyContains && this.propertyContains.usesProperty(prop)) || (this.propertyMatches && this.propertyMatches.usesProperty(prop));
			}
		}
	});

	var CategorySettings = function(data){
		var self = this;
		var node = new TreeNode();
		node.category = this;
		Object.defineProperty(this, 'node', {value:node});
		this.name = data.name;
		this.categories = [];
		(data.categories || []).map(function(cd){
			var cat = new CategorySettings(cd);
			self.addCategory(cat);
			return cat;
		});
		this.rowCollection = data.rowCollection;
		this.acceptRow = data.acceptRow && new AcceptRow(data.acceptRow);
		this.expect = data.expect;
		this.oncePerPeriod = data.oncePerPeriod || false;
	};
	CategorySettings.prototype = Object.create(CategorySettings.prototype, {
		usesProperty:{
			value:function(prop){
				if(this.acceptRow && this.acceptRow.usesProperty(prop)){
					return true;
				}
				if(this.rowCollection && this.rowCollection.properties.some(function(p){return p.source == prop.name;})){
					return true;
				}
				return this.categories.some(function(c){return c.usesProperty(prop);});
			}
		},
		addCategory:{
			value:function(cat){
				this.categories.push(cat);
				this.node.add(cat.node);
			}
		},
		removeCategory:{
			value:function(cat){
				cat.destroy();
				var index = this.categories.indexOf(cat);
				this.categories.splice(index, 1);
			}
		},
		destroy:{
			value:function(){
				this.oncePerPeriod = false;
				this.node.destroy();
			}
		},
		getNewCategory:{
			value:function(){
				return new CategorySettings({});
			}
		},
		onceOverridden:{
			get:function(){
				if(this.oncePerPeriod){
					return false;
				}
				return this.node.some(function(n){return n.category && n.category.oncePerPeriod;});
			}
		}
	});

	var Settings = function(data){
		this.rowDefinition = new RowDefinition(data.rowDefinition);
		var incoming = new CategorySettings(data.categories.incoming);
		var outgoing = new CategorySettings(data.categories.outgoing);
		var categoriesRoot = new TreeNode();
		categoriesRoot.add(incoming.node);
		categoriesRoot.add(outgoing.node);
		this.categories = {
			incoming: incoming,
			outgoing: outgoing
		};
		this.ignoreFirstLine = data.ignoreFirstLine || false;
	};
	Settings.prototype = Object.create(Settings.prototype, {
		usesProperty:{
			value:function(prop){
				return this.categories.incoming.usesProperty(prop) || this.categories.outgoing.usesProperty(prop);
			}
		}
	});
	return Settings;
})()