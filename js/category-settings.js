var regexInputBuilder = require("./regex-input.js");
var customCheckboxBuilder = require("./custom-checkbox.js");
var TreeNode = require("./treenode.js");
var propertyContains = require("./property-contains.js");
var propertyMatches = require("./property-matches.js");

module.exports = (function(){
	var build = function(document){
		var regexInput = regexInputBuilder.build(document);
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
								this.filterByPropertyContains();
							}else if(verb === "matches"){
								this.filterByPropertyMatches();
							}
						},
						toggleCollection:function(){
							if(!this.data.category.rowCollection){
								var firstProperty = this.propertyList[0];
								var newRowCollection = {
									properties:[{name:firstProperty.name,source:firstProperty.name}]
								};
								this.$set(this.data.category, 'rowCollection', newRowCollection);
							}
						},
						removeRowCollection:function(){
							if(this.data.category.rowCollection){
								this.$delete(this.data.category, 'rowCollection');
							}
						},
						toggleFilter:function(){
							if(this.filterActive){
								this.removeFilter();
							}else{
								if(this.propertyList.length == 0){
									return;
								}
								var newFilter = this.usedFilters.propertyContains || this.usedFilters.propertyMatches || this.createPropertyContains();
								this.filterBy(newFilter);
							}
							this.onPropertyUseChange();
						},
						filterByPropertyMatches:function(){
							var newFilter = this.usedFilters.propertyMatches || this.createPropertyMatches();
							this.filterBy(newFilter);
						},
						filterByPropertyContains:function(){
							var newFilter = this.usedFilters.propertyContains || this.createPropertyContains();
							this.filterBy(newFilter);
						},
						createPropertyContains:function(){
							return {propertyContains:{name:this.propertyList[0].name,values:[]}};
						},
						createPropertyMatches:function(){
							return {propertyMatches:{name:this.propertyList[0].name, pattern:undefined}};
						},
						removeFilter:function(){
							if(!this.data.category.acceptRow){
								return;
							}
							var acceptRow = this.data.category.acceptRow;
							if(acceptRow.propertyContains){
								this.usedFilters.propertyContains = acceptRow;
							}
							if(acceptRow.propertyMatches){
								this.usedFilters.propertyMatches = acceptRow;
							}
							this.$delete(this.data.category, 'acceptRow');
						},
						filterBy:function(acceptRow){
							this.removeFilter();
							this.$set(this.data.category, 'acceptRow', acceptRow);
						},
						changed:function(){
							this.$emit("changed");
						},
						nextKey:(function(initial){return function(){
							return initial++;
						}})(0),
						createNewCategorySlot:function(){
							return this.createCategorySlot({
								category:{name:undefined},
								exists:false
							});
						},
						createCategorySlot:function(specs){
							var key = this.nextKey();
							var newSlot = new TreeNode();
							this.data.add(newSlot);
							newSlot.category = specs.category;
							newSlot.exists = specs.exists;
							newSlot.key = key;
							return newSlot;
						},
						createCategorySlots:function(){
							for(var i=0;i<this.categorySlots.length;i++){
								this.categorySlots[i].destroy();
							}
							var self = this;
							var result = [];
							if(this.data.category.categories){
								result = this.data.category.categories.map(function(cat, index){
									return self.createCategorySlot({
										category:cat,
										exists:true
									});});
							}
							if(this.propertyList.length > 0){
								result.push(this.createNewCategorySlot());
							}
							this.categorySlots = result;
						},
						onPropertyUseChange:function(){
							this.$emit("propertyusechange");
							this.changed();
						},
						addNewCategory:function(c){
							c.exists = true;
							if(!this.data.category.categories){
								this.$set(this.data.category, 'categories',[]);
							}
							this.data.category.categories.push(c.category);
							this.categorySlots.push(this.createNewCategorySlot());
						},
						removeCategory:function(c){
							var index = this.data.category.categories.indexOf(c.category);
							this.data.category.categories.splice(index, 1);
							this.categorySlots.splice(index, 1);
						}
					},
					mounted:function(){
						this.createCategorySlots();
					},
					components:{
						'property-contains':propertyContains.build(document),
						'property-matches':propertyMatches.build(document),
						'row-collection':{
							props:{
								data:Object,
								propertyList:Array
							},
							methods:{
								onRemove:function(property){
									var index = this.data.properties.indexOf(property);
									console.log("removing a property at ", index);
									this.data.properties.splice(index, 1);
									this.$emit("change");
									if(this.data.properties.length == 0){
										this.$emit("remove");
									}
								},
								addProperty:function(){
									var firstProperty = this.propertyList[0];
									this.data.properties.push({name:firstProperty.name,source:firstProperty.name});
								},
								onValid:function(v, msg){
									this.$emit("valid", v, msg);
								}
							},
							components:{
								'row-property':{
									props:{
										property:Object,
										propertyList:Array
									},
									computed:{
										targetType:{
											get:function(){
												if(this.property.conversion){
													return this.property.conversion.type;
												}
												return "string";
											},
											set:function(t){
												if(t === "date"){
													var newConversion = {type:"date",pattern:"%Y%m%d"};
													if(this.property.conversion){
														if(this.property.conversion.type !== "date"){
															console.log("setting conversion to a date conversion")
															this.property.conversion = newConversion;
														}
													}else{
														console.log("adding a date conversion");
														this.$set(this.property, 'conversion',newConversion);
													}
												}
												else if(this.property.conversion && this.property.conversion.type === "date"){
													console.log("removing a date conversion");
													this.$delete(this.property, 'conversion');
												}
											}
										},
										stringMatch:{
											get:function(){
												if(this.property.conversion && this.property.conversion.type === "string"){
													return this.property.conversion.match;
												}
												return undefined;
											},
											set:function(m){
												if(!m){
													if(this.property.conversion && this.property.conversion.type == "string"){
														console.log("removing a string conversion");
														this.$delete(this.property, 'conversion');
													}
													return;
												}
												if(!this.property.conversion){
													console.log("adding a string conversion");
													this.$set(this.property, 'conversion',{type:"string",match:undefined})
												}
												this.property.conversion.match = m;
											}
										},
										source:function(){return this.property.source;},
										name:function(){return this.property.name;},
										hasStringSource:function(){
											var self = this;
											return this.propertyList.some(function(p){return p.name == self.property.source;})
										}
									},
									watch:{
										source:function(v){
											this.$emit("propertyusechange");
											if(v === "date"){
												this.property.name = "date";
											}
											if(v == "amount"){
												this.property.name = "amount";
											}
										},
										name:function(n){
											this.$emit("change");
										},
										targetType:function(t){
											this.$emit("change");
										}
									},
									methods:{
										onValid:function(v, msg){
											this.$emit("valid", v, msg);
										}
									},
									components:{
										'source-property-input':{
											props:{
												property:String,
												propertyList:Array
											},
											model:{
												prop:"property",
												event:"input"
											},
											computed:{
												displayPropertyList:function(){
													var self = this;
													return this.propertyList.filter(function(p){return p.name == self.property || self.expanded;});
												}
											},
											data:function(){
												return {expanded:false};
											},
											methods:{
												select:function(v){
													if(!this.expanded){
														this.expanded = true;
														return;
													}
													this.expanded = false;
													this.$emit("input", v);
												}
											},
											template:document.getElementById("sourcePropertyInputTemplate").innerHTML
										},
										'target-type-input':{
											props:{
												type:String
											},
											model:{
												prop:"type",
												event:"input"
											},
											data:function(){
												return {expanded:false};
											},
											methods:{
												select:function(v){
													if(!this.expanded){
														this.expanded = true;
														return;
													}
													this.expanded = false;
													this.$emit("input", v);
												}
											},
											template:document.getElementById("targetTypeInputTemplate").innerHTML
										},
										'regex-input':regexInput
									},
									template:document.getElementById("rowPropertyTemplate").innerHTML
								}
							},
							template:document.getElementById("rowCollectionSettingsTemplate").innerHTML
						},
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
									if(b){
										this.$set(this.data.category, 'oncePerPeriod', true);
									}else{
										if(this.data.category.oncePerPeriod){
											this.$delete(this.data.category, 'oncePerPeriod');
										}
									}
								}
							}
						},
						onceOverridden:function(){
							return !this.data.category.oncePerPeriod && this.data.some(function(slot){return slot.category.oncePerPeriod;});
						},
						draggable:function(){return !this.top && this.data.exists;}
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
						propertyList:function(v){
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