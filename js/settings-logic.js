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

	var AdditionalProperty = function(data, settings, rowDefinition){
		RowProperty.apply(this,[data]);
		Object.defineProperty(this, 'settings', {value:settings});
		Object.defineProperty(this, 'rowDefinition', {value:rowDefinition});
		Object.defineProperty(this, '_name', {value:data.name, writable:true});
		Object.defineProperty(this, 'name', {
			get:function(){return this._name;},
			set:function(v){
				if(v === "date" || v === "amount" || v === "direction"){
					throw new Error("\""+v+"\" is a reserved name. Please don't use it for a column.")
				}
				this._name = v;
				if(v){
					this.add();
				}else{
					this.remove();
				}
			},
			configurable:true,
			enumerable:true
		});
	};
	inherit(AdditionalProperty, RowProperty);
	defGet(AdditionalProperty.prototype, "type", "string");
	defGetFn(AdditionalProperty.prototype, "inUse", function(){return this.settings.usesProperty(this);});
	AdditionalProperty.prototype.add = function(){
		this.rowDefinition.addDefinition(this);
	};
	AdditionalProperty.prototype.remove = function(){
		this.rowDefinition.removeDefinition(this);
	};

	var RowDefinition = function(data, settings){
		var self = this;
		Object.defineProperty(this, 'settings', {value:settings});
		this.amount = new AmountProperty(data.amount);
		this.date = new DateProperty(data.date);
		this.direction = new DirectionProperty(data.direction);
		this.additional = (data.additional || []).map(function(d){return new AdditionalProperty(d, settings, self);});
	};
	defGetFn(RowDefinition.prototype, 'definitions', function(){return [this.amount, this.date, this.direction].concat(this.additional);});
	defGetFn(RowDefinition.prototype, 'maxColumnIndex', function(){return Math.max.apply(null, this.definitions.map(function(d){return d.columnIndex;}));});
	RowDefinition.prototype.getNewDefinition = function(index){
		return new AdditionalProperty({name:undefined, columnIndex:index}, this.settings, this);
	};
	RowDefinition.prototype.getDefinitionAtIndex = function(index){
		return this.definitions.find(function(d){return d.columnIndex == index;});
	};
	RowDefinition.prototype.addDefinition = function(d){
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
	};
	RowDefinition.prototype.removeDefinition = function(d){
		var index = this.additional.indexOf(d);
		if(index > -1){
			this.additional.splice(index, 1);
		}
	};

	var FilterCache = function(rowDefinition){
		this.propertyContains = undefined;
		this.propertyMatches = undefined;
		this.latest = undefined;
		this.rowDefinition = rowDefinition;
	};
	FilterCache.prototype = Object.create(FilterCache.prototype, {
		getPropertyContains:{
			value:function(){
				return this.propertyContains || (this.propertyContains = this.createPropertyContains());
			}
		},
		createPropertyContains:{
			value:function(){
				var name = (this.latest && this.latest.name) || this.rowDefinition.additional[0].name;
				return new PropertyContains({name:name});
			}
		},
		getPropertyMatches:{
			value:function(){
				return this.propertyMatches || (this.propertyMatches = this.createPropertyMatches());
			}
		},
		createPropertyMatches:{
			value:function(){
				var name = (this.latest && this.latest.name) || this.rowDefinition.additional[0].name;
				return new PropertyMatches({name:name});
			}
		},
		save:{
			value:function(acceptRow){
				this.propertyContains = acceptRow.propertyContains || this.propertyContains;
				this.propertyMatches = acceptRow.propertyMatches || this.propertyMatches;
				this.latest = acceptRow.propertyMatches || acceptRow.propertyContains;
			}
		},
		getFilter:{
			value:function(){
				return this.latest || this.createPropertyContains();
			}
		}
	});

	var PropertyContains = function(data){
		this.name = data.name;
		this.values = data.values || [];
	};
	PropertyContains.prototype = Object.create(PropertyContains.prototype, {
		usesProperty:{
			value:function(prop){return prop.name == this.name;}
		},
		toAcceptRow:{
			value:function(){
				return new AcceptRow({propertyContains:this});
			}
		}
	});

	var PropertyMatches = function(data){
		this.name = data.name;
		this.pattern = data.pattern;
	};
	PropertyMatches.prototype = Object.create(PropertyMatches.prototype, {
		usesProperty:{
			value:function(prop){return prop.name == this.name;}
		},
		toAcceptRow:{
			value:function(){
				return new AcceptRow({propertyMatches:this});
			}
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

	var DateConversion = function(data){
		this.type = "date";
		this.pattern = data.pattern || "%Y%m%d";
	};

	var StringConversion = function(data){
		this.type = "string";
		this.match = data.match;
	};

	var RowCollectionProperty = function(data, collection){
		Object.defineProperty(this, 'collection', {value:collection});
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

	var RowCollection = function(data, onDestroy, rowDefinition){
		var self = this;
		Object.defineProperty(this, 'rowDefinition', {value:rowDefinition});
		Object.defineProperty(this, 'onDestroy', {value:onDestroy});
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

	var categorySettingsId = 0;

	var CategorySettings = function(data, rowDefinition){
		var self = this;
		var node = new TreeNode();
		node.category = this;
		Object.defineProperty(this, 'node', {value:node});
		Object.defineProperty(this, 'filterCache', {value:new FilterCache(rowDefinition)});
		Object.defineProperty(this, 'rowDefinition', {value:rowDefinition});
		Object.defineProperty(this, 'id', {value:categorySettingsId++});
		Object.defineProperty(this, '_expect', {value:data.expect || undefined, writable:true});
		Object.defineProperty(this, 'expect', {
			get:function(){return this._expect;},
			set:function(n){
				this._expect = n || undefined;
			},
			configurable:true,
			enumerable:true
		});
		this.name = data.name;
		this.categories = [];
		(data.categories || []).map(function(cd){
			var cat = new CategorySettings(cd, rowDefinition);
			self.addCategory(cat);
			return cat;
		});
		this.rowCollection = data.rowCollection && new RowCollection(data.rowCollection, function(){self.removeRowCollection();}, rowDefinition);
		this.acceptRow = data.acceptRow && new AcceptRow(data.acceptRow);
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
		removeRowCollection:{
			value:function(){
				this.rowCollection = undefined;
			}
		},
		addRowCollection:{
			value:function(){
				var self = this;
				this.rowCollection = new RowCollection({properties:[]}, function(){self.removeRowCollection();}, this.rowDefinition);
				this.rowCollection.addProperty();
			}
		},
		addCategory:{
			value:function(cat){
				this.categories.push(cat);
				this.node.add(cat.node);
			}
		},
		insertCategoryBefore:{
			value:function(category, referenceCategory){
				var index = this.categories.indexOf(referenceCategory);
				if(index > -1){
					this.categories.splice(index, 0, category);
					this.node.add(category.node);
					return true;
				}
				return !!this.categories.find(function(c){return c.insertCategoryBefore(category, referenceCategory);});
			}
		},
		insertCategoryAfter:{
			value:function(category, referenceCategory){
				var index = this.categories.indexOf(referenceCategory);
				if(index > -1){
					this.categories.splice(index + 1, 0, category);
					this.node.add(category.node);
					return true;
				}
				return !!this.categories.find(function(c){return c.insertCategoryAfter(category, referenceCategory);});
			}
		},
		addCategoryToParent:{
			value:function(category, parentCategory){
				if(parentCategory == this){
					this.addCategory(category);
					return true;
				}
				return !!this.categories.find(function(c){return c.addCategoryToParent(category, parentCategory);});
			}
		},
		removeCategory:{
			value:function(cat){
				cat.destroy();
				var index = this.categories.indexOf(cat);
				if(index  > -1){
					this.categories.splice(index, 1);
					return true;
				}else{
					for(var i=0;i<this.categories.length;i++){
						if(this.categories[i].removeCategory(cat)){
							return true;
						}
					}
				}
				return false;
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
				return new CategorySettings({}, this.rowDefinition);
			}
		},
		onceOverridden:{
			get:function(){
				if(this.oncePerPeriod){
					return false;
				}
				return this.node.some(function(n){return n.category && n.category.oncePerPeriod;});
			}
		},
		removeFilter:{
			value:function(){
				if(!this.acceptRow){
					return;
				}
				this.filterCache.save(this.acceptRow);
				this.acceptRow = undefined;
			}
		},
		toggleFilter:{
			value:function(){
				if(this.acceptRow){
					this.removeFilter();
				}else{
					this.acceptRow = this.filterCache.getFilter().toAcceptRow();
				}
			}
		},
		filterByPropertyMatches:{
			value:function(){
				this.filterCache.save(this.acceptRow);
				this.acceptRow = this.filterCache.getPropertyMatches().toAcceptRow();
			}
		},
		filterByPropertyContains:{
			value:function(){
				this.filterCache.save(this.acceptRow);
				this.acceptRow = this.filterCache.getPropertyContains().toAcceptRow();
			}
		}
	});

	var Settings = function(data){
		this.rowDefinition = new RowDefinition(data.rowDefinition, this);
		var incoming = new CategorySettings(data.categories.incoming, this.rowDefinition);
		var outgoing = new CategorySettings(data.categories.outgoing, this.rowDefinition);
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
		},
		removeCategory:{
			value:function(category){
				this.categories.incoming.removeCategory(category);
				this.categories.outgoing.removeCategory(category);
			}
		},
		insertCategoryBefore:{
			value:function(category, referenceCategory){
				this.removeCategory(category);
				if(!this.categories.incoming.insertCategoryBefore(category, referenceCategory)){
					this.categories.outgoing.insertCategoryBefore(category, referenceCategory);
				}
			}
		},
		insertCategoryAfter:{
			value:function(category, referenceCategory){
				this.removeCategory(category);
				if(!this.categories.incoming.insertCategoryAfter(category, referenceCategory)){
					this.categories.outgoing.insertCategoryAfter(category, referenceCategory);
				}
			}
		},
		addCategoryToParent:{
			value:function(category, parentCategory){
				this.removeCategory(category);
				if(!this.categories.incoming.addCategoryToParent(category, parentCategory)){
					this.categories.outgoing.addCategoryToParent(category, parentCategory);
				}
			}
		}
	});
	return Settings;
})()