var TreeNode = require("./treenode.js");
var RowDefinition = require("./row-definition.js");
var CategorySettings = require("./category-settings.js");

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

module.exports = Settings;