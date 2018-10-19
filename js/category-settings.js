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
						parentdraggedslot:Object,
						draggedfrom:Boolean
					},
					methods:{
						onDragEnd:function(e){
							e.preventDefault();
							e.cancelBubble = true;
							this.$emit("categorydragend")
						},
						onChildDragEnd:function(){
							this.draggedSlot = undefined;
						},
						onDragOver:function(e){
							if(!this.parentdraggedslot){
								return;
							}
							e.preventDefault();
							this.draggedOver = true;
						},
						onDrop:function(e){
							if(!this.parentdraggedslot){
								return;
							}
							e.preventDefault();
							e.cancelBubble = true;
							this.$emit("categorydropbefore", this.data);
							this.draggedOver = false;
						},
						onDragStart:function(e){
							this.$emit("categorydragstart", this.data);
							e.cancelBubble = true;
						},
						onCategoryDragStart:function(slot){
							this.draggedSlot = slot;
						},
						onChildCategoryDropBefore:function(slot){
							var newCategories = [];
							var draggedCategory = this.draggedSlot.category;
							this.draggedSlot = undefined;
							var indexOfDraggedCategory = this.data.category.categories.indexOf(draggedCategory);
							var indexOfTargetCategory;
							if(slot.exists){
								indexOfTargetCategory = this.data.category.categories.indexOf(slot.category);
							}else{
								indexOfTargetCategory = this.data.category.categories.length;
							}
							if(indexOfTargetCategory == indexOfDraggedCategory + 1 || indexOfTargetCategory == indexOfDraggedCategory){
								return;
							}
							if(indexOfTargetCategory == 0){
								newCategories.push(draggedCategory);
							}
							for(var i=0;i<this.data.category.categories.length;i++){
								if(i == indexOfDraggedCategory){
									continue;
								}
								newCategories.push(this.data.category.categories[i])
								if(i == indexOfTargetCategory - 1){
									newCategories.push(draggedCategory);
								}
							}
							console.log("within "+this.data.category.name+": dropped "+draggedCategory.name+" before slot ", slot.category.name);
							this.data.category.categories = newCategories;
							this.createCategorySlots();
							this.changed();
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
						changed:function(){
							this.$emit("changed");
						},
						nextKey:(function(initial){return function(){
							return initial++;
						}})(0),
						createNewCategorySlot:function(){
							return this.createCategorySlot({
								category:this.data.category.getNewCategory(),
								exists:false
							});
						},
						createCategorySlot:function(specs){
							return {
								category:specs.category,
								exists:specs.exists,
								key:this.nextKey()
							};
						},
						createCategorySlots:function(){
							var self = this;
							var result = [];
							result = this.data.category.categories.map(function(cat){
								return self.createCategorySlot({
									category:cat,
									exists:true
								});});
							if(this.propertyList.length > 0){
								result.push(this.createNewCategorySlot());
							}
							this.categorySlots = result;
						},
						addNewCategory:function(c){
							c.exists = true;
							this.data.category.addCategory(c.category);
							this.categorySlots.push(this.createNewCategorySlot());
						},
						removeCategory:function(c){
							var index = this.categorySlots.indexOf(c);
							this.categorySlots.splice(index, 1);
							this.data.category.removeCategory(c.category);
						}
					},
					mounted:function(){
						this.createCategorySlots();
					},
					components:{
						'property-contains':propertyContains.build(document),
						'property-matches':propertyMatches.build(document),
						'row-collection':rowCollection.build(document),
						'custom-checkbox':customCheckboxBuilder.build(document)
					},
					computed:{
						name:function(){return this.data.category.name;},
						filterActive:function(){return !!this.data.category.acceptRow;},
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
						draggable:function(){return !this.top && this.data.exists;},
						hasAdditional:function(){return this.propertyList.length > 0;}
					},
					watch:{
						name:function(v){
							if(v && !this.data.exists){
								this.$emit("categorycreated", this.data);
							}
							if(!v && this.data.exists){
								this.$emit("categoryremoved", this.data);
							}
						},
						data:function(){
							this.createCategorySlots();
						},
						hasAdditional:function(v){
							this.createCategorySlots();
						}
					},
					data:function(){
						return {
							collapsed:true,
							categorySlots:[],
							newCategorySlot:undefined,
							usedFilters:{},
							draggedSlot:undefined,
							draggedOver:false
						}
					},
					template:document.getElementById("categorySettingsTemplate").innerHTML
				};
	};
	return {build:build};
})()