var customCheckboxBuilder = require("./custom-checkbox.js");
var propertyContains = require("./property-contains.js");
var propertyMatches = require("./property-matches.js");
var rowCollection = require("./row-collection-settings.js");

module.exports = (function(){
	var build = function(document){
		return {
					name:'category-settings',
					props:{
						top:Boolean,
						data:Object,
						propertyList:Array,
						draggedfrom:Boolean,
						draggedcategory:Object
					},
					methods:{
						onDragEnd:function(e){
							e.preventDefault();
							e.cancelBubble = true;
							this.$emit("categorydragend");
						},
						onChildDragEnd:function(){
							this.$emit("categorydragend");
						},
						onDragOver:function(e){
							if(this.top){
								return;
							}
							e.preventDefault();
							e.cancelBubble = true;
							this.draggedOver = true;
						},
						onDrop:function(e){
							if(this.top){
								return;
							}
							e.preventDefault();
							e.cancelBubble = true;
							this.draggedOver = false;
							if(this.data.exists){
								this.$emit("insertcategorybefore",this.data.category);
							}else{
								if(this.data.previousSlot){
									this.$emit("insertcategoryafter",this.data.previousSlot.category);
								}else{
									this.$emit("addcategorytoparent", this.data.parentSlot.category);
								}
							}
						},
						onInsertCategoryBefore:function(c){
							this.$emit("insertcategorybefore", c);
						},
						onInsertCategoryAfter:function(c){
							this.$emit("insertcategoryafter", c);
						},
						onAddCategoryToParent:function(p){
							this.$emit("addcategorytoparent", p);
						},
						onDragStart:function(e){
							this.$emit("categorydragstart", this.data.category);
							e.cancelBubble = true;
						},
						onCategoryDragStart:function(cat){
							this.$emit("categorydragstart", cat);
						},
						onValid:function(v, msg){
							this.$emit("valid", v, msg);
						},
						toggleCollapse:function(){
							if(!this.data.exists){
								return;
							}
							this.collapsed = !this.collapsed;
						},
						onSwitch:function(verb){
							if(verb === "contains"){
								this.data.category.filterByPropertyContains();
							}else if(verb === "matches"){
								this.data.category.filterByPropertyMatches();
							}
						},
						toggleCollection:function(){
							this.data.category.addRowCollection();
						},
						toggleFilter:function(){
							this.data.category.toggleFilter();
						},
						createNewCategorySlot:function(latestSlot){
							return this.createCategorySlot({
								category:this.data.category.getNewCategory(),
								exists:false,
								previousSlot:latestSlot
							});
						},
						createCategorySlot:function(specs){
							return {
								category:specs.category,
								exists:specs.exists,
								key:specs.category.id,
								previousSlot: specs.previousSlot || undefined,
								parentSlot: this.data
							};
						},
						addNewCategory:function(c){
							c.exists = true;
							this.data.category.addCategory(c.category);
						},
						removeCategory:function(c){
							this.data.category.removeCategory(c.category);
						}
					},
					components:{
						'property-contains':propertyContains.build(document),
						'property-matches':propertyMatches.build(document),
						'row-collection':rowCollection.build(document),
						'custom-checkbox':customCheckboxBuilder.build(document)
					},
					computed:{
						name:{
							get:function(){return this.data.category.name;},
							set:function(v){
								this.data.category.name = v;
								if(v && !this.data.exists){
									this.$emit("categorycreated", this.data);
								}
								if(!v && this.data.exists){
									this.$emit("categoryremoved", this.data);
								}
							}
						},
						filterActive:function(){return !!this.data.category.acceptRow;},
						categorySlots:function(){
							var self = this;
							var result = [];
							var latestSlot = undefined;
							result = this.data.category.categories.map(function(cat){
								latestSlot = self.createCategorySlot({
									category:cat,
									exists:true,
									previousSlot:latestSlot
								});
								return latestSlot;
							});
							if(this.propertyList.length > 0){
								result.push(this.createNewCategorySlot(latestSlot));
							}
							return result;
						},
						expectation:{
							get:function(){
								return this.data.category.expect || "";
							},
							set:function(v){
								var num = Math.max(0, parseInt(v));
								if(num > 0){
									if(!("expect" in this.data.category)){
										this.$set(this.data.category, "expect", num);
									}
									this.data.category.expect = num;
								}else{
									if("expect" in this.data.category){
										this.$delete(this.data.category, "expect");
									}
								}
							}
						},
						collectionActive:function(){return !!this.data.category.rowCollection;},
						nonExistent:function(){return !this.data.exists;},
						oncePerPeriod:{
							get:function(){
								return this.data && this.data.category.oncePerPeriod;
							},
							set:function(b){
								if(this.data){
									this.data.category.oncePerPeriod = b;
								}
							}
						},
						onceOverridden:function(){
							return this.data.category.onceOverridden;
						},
						draggable:function(){return !this.top && this.data.exists && this.collapsed;}
					},
					data:function(){
						return {
							collapsed:true,
							newCategorySlot:undefined,
							usedFilters:{},
							draggedOver:false
						}
					},
					template:document.getElementById("categorySettingsTemplate").innerHTML
				};
	};
	return {build:build};
})()