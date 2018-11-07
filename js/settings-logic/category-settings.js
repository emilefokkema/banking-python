var TreeNode = require("./treenode.js");
var FilterCache = require("./filter-cache.js");
var AcceptRow = require("./accept-row.js");
var RowCollection = require("./row-collection.js");
var makeReadOnly = require("./make-readonly.js");
var defineProperties = require("./define-properties.js");

var categorySettingsId = 0;

var CategorySettings = function(data, rowDefinition){
	var self = this;
	var node = new TreeNode();
	node.category = this;
	makeReadOnly(this, function(){
		this.node = node;
		this.filterCache = new FilterCache(rowDefinition);
		this.rowDefinition = rowDefinition;
		this.id = categorySettingsId++;
	});
	defineProperties(this, function(){
		this.expect = {
			initial: data.expect || undefined,
			set:function(set, v){
				set(v || undefined);
			}
		};
		this.oncePerPeriod = {
			initial: !!data.oncePerPeriod,
			get:function(v){return v || undefined;}
		}
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
			if(this.rowCollection){
				return;
			}
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
				this.acceptRow = new AcceptRow(this.filterCache.getFilter());
			}
		}
	},
	filterByPropertyMatches:{
		value:function(){
			this.filterCache.save(this.acceptRow);
			this.acceptRow = new AcceptRow(this.filterCache.getPropertyMatches());
		}
	},
	filterByPropertyContains:{
		value:function(){
			this.filterCache.save(this.acceptRow);
			this.acceptRow = new AcceptRow(this.filterCache.getPropertyContains());
		}
	}
});

module.exports = CategorySettings;