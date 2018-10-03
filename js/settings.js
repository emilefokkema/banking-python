var customCheckboxBuilder = require("./custom-checkbox.js");
var postget = require("./postget.js");
var TreeNode = require("./treenode.js");
var columnSlot = require("./column-slot.js");
var categorySettings = require("./category-settings.js");

module.exports = (function(){
	var build = function(document){
		return {
					props:{
						loadingstatus: Object,
						loggedinname:String
					},
					data:function(){
						return {
							data: undefined,
							collapsed:true,
							slots:[],
							selectedSlots:[],
							dirty:false,
							saved:false,
							violationCount:0,
							categorySlots:[],
							categoriesParent:this.createCategoriesParent()
						};
					},
					mounted:function(){
						this.getSettings();
					},
					components:{
						'column-slot':columnSlot.build(document),
						'category-settings':categorySettings.build(document),
						'custom-checkbox':customCheckboxBuilder.build(document)
					},
					watch:{
						data:function(v){
							this.createSlots();
							this.createCategorySlots();
						},
						saved:function(s){
							if(s){
								this.$emit("saved");
							}
						},
						dirty:function(v){
							if(v){
								this.$emit("settingsdirty");
							}else{
								this.$emit("settingsclean");
							}
						},
						violationCount:function(c){
							if(c == 0){
								this.$emit("settingsvalid");
							}
						}
					},
					computed:{
						definitions:function(){
							return [this.data.rowDefinition.amount, this.data.rowDefinition.date, this.data.rowDefinition.direction].concat(this.data.rowDefinition.additional || []);
						},
						canSwitch:function(){
							return this.selectedSlots.length == 2;
						},
						ignoreFirstLine:{
							get:function(){return this.data && this.data.ignoreFirstLine;},
							set:function(v){
								if(this.data){
									if(!('ignoreFirstLine' in this.data)){
										this.$set(this.data, 'ignoreFirstLine', v);
									}
									this.data.ignoreFirstLine = v;
								}
							}
						}
					},
					methods:{
						createCategoriesParent:function(){
							var parent = new TreeNode();
							parent.category = {};
							return parent;
						},
						onValid:function(v, msg){
							if(v){
								this.violationCount--;
							}else{
								this.violationCount++;
								if(msg){
									this.$emit("error", msg);
								}
							}
						},
						getSettings:function(){
							var self = this;
							var loading = this.loadingstatus.getIncomplete();
							postget.doGet("/api/settings",function(data){
								if(data){
									self.data = data;
									self.dirty = false;
									self.saved = true;
									loading.complete();
								}else{
									self.collapsed = false;
									postget.doGet("/api/settings/default", function(data){
										self.data = data;
										self.dirty = true;
										self.saved = false;
										loading.complete();
									}, function(msg){
										self.$emit("error",msg);
										loading.complete();
									})
								}
							},function(msg){
								self.$emit("error",msg);
								loading.complete();
							});
						},
						onChanged:function(){
							this.dirty = true;
						},
						onPropertyNameChange:function(newName, slot){
							this.onChanged();
							var nameValid = newName !== "date" && newName !== "amount" && newName !== "direction";
							var oldNameValid = slot.nameValid;
							if(oldNameValid != nameValid){
								this.onValid(nameValid, "\""+newName+"\" is a reserved name. Please don't use it for a column.");
							}
							slot.nameValid = nameValid;
							if(!this.data.rowDefinition.additional){
								return;
							}
							for(var i=0;i<this.data.rowDefinition.additional.length;i++){
								var definition = this.data.rowDefinition.additional[i];
								if(definition !== slot.definition && definition.name === newName){
									this.data.rowDefinition.additional.splice(i, 1);
									this.createSlots();
									return;
								}
							}
						},
						doSlotSwitch:function(){
							var self = this;
							var slot1 = this.slots.find(function(d){return d.definition.columnIndex == self.selectedSlots[0];});
							var slot2 = this.slots.find(function(d){return d.definition.columnIndex == self.selectedSlots[1];});
							slot1.definition.columnIndex = this.selectedSlots[1];
							slot2.definition.columnIndex = this.selectedSlots[0];
							if(this.definitions.indexOf(slot1.definition) != -1 || this.definitions.indexOf(slot2.definition) != -1){
								this.dirty = true;
							}
							this.createSlots();
						},
						onSlotSelected:function(i){
							if(this.selectedSlots.length < 2){
								this.selectedSlots.push(i);
							}else{
								this.slots[this.selectedSlots[0]].selected = false;
								this.selectedSlots[0] = i;
							}
							this.slots[i].selected = true;
						},
						onSlotDeselected:function(i){
							this.selectedSlots.splice(this.selectedSlots.indexOf(i), 1);
							this.slots[i].selected = false;
						},
						onDefinitionCreated:function(d){
							console.log("definition crated");
							if(!this.data.rowDefinition.additional){
								this.$set(this.data.rowDefinition, 'additional', []);
							}
							this.data.rowDefinition.additional.push(d);
							this.createSlots();
							this.dirty = true;
						},
						onDefinitionRemoved:function(d){
							console.log("definition removed");
							var index = this.data.rowDefinition.additional.indexOf(d);
							this.data.rowDefinition.additional.splice(index, 1);
							this.createSlots();
							this.dirty = true;
						},
						addNewSlot:function(){
							this.slots.push(this.makeSlotData(this.slots.length));
						},
						createSlots:function(){
							this.selectedSlots = [];
							var self = this;
							var numberOfSlots = Math.max.apply(null, this.definitions.map(function(x){return x.columnIndex;})) + 1;
							this.slots = Array.apply(null, new Array(numberOfSlots)).map(function(x, i){return self.makeSlotData(i);});
							this.determineProtection();
						},
						createCategorySlots:function(){
							var incoming = new TreeNode();
							incoming.category = this.data.categories.incoming;
							incoming.exists = true;
							var outgoing = new TreeNode();
							outgoing.category = this.data.categories.outgoing;
							outgoing.exists = true;
							this.categoriesParent.add(incoming);
							this.categoriesParent.add(outgoing);
							this.categorySlots = [incoming, outgoing];
						},
						usesProperty:function(cat, propertyName){
							var self = this;
							if(cat.acceptRow && cat.acceptRow.propertyContains && cat.acceptRow.propertyContains.name == propertyName){
								return true;
							}
							if(cat.acceptRow && cat.acceptRow.propertyMatches && cat.acceptRow.propertyMatches.name == propertyName){
								return true;
							}
							if(cat.rowCollection && cat.rowCollection.properties.some(function(p){return p.source == propertyName;})){
								return true;
							}
							return cat.categories && cat.categories.some(function(c){return self.usesProperty(c, propertyName);});
						},
						determineProtection:function(){
							for(var i=0;i<this.slots.length;i++){
								var slot = this.slots[i];
								if(!slot.definitionExists){
									continue;
								}
								slot.protected = this.usesProperty(this.data.categories.incoming, slot.definition.name) || this.usesProperty(this.data.categories.outgoing, slot.definition.name);
							}
						},
						save:function(){
							var self = this;
							var loading = this.loadingstatus.getIncomplete();
							postget.doPost("/api/settings", JSON.stringify(this.data), function(){
								self.getSettings();
								loading.complete();
							}, function(msg){
								self.$emit("error",msg);
								loading.complete();
							});
						},
						toggleCollapse:function(){
							this.collapsed = !this.collapsed;
						},
						makeNewSlotData:function(index){
							return {
								protected:false,
								definitionExists:false,
								nameValid:true,
								selected:false,
								type:"string",
								definition:{name:undefined,columnIndex:index}
							};
						},
						makeSlotData:function(index){
							var definition = this.definitions.find(function(d){return d.columnIndex == index;});
							if(!definition){
								return this.makeNewSlotData(index);
							}
							var type;
							if(definition == this.data.rowDefinition.amount){
								type = "amount";
							}
							else if(definition == this.data.rowDefinition.date){
								type = "date";
							}
							else if(definition == this.data.rowDefinition.direction){
								type = "direction";
							}
							else{
								type = "string";
							}
							return {
								protected:false,
								nameValid:true,
								definitionExists:true,
								type:type,
								definition:definition,
								selected:false
							};
						}
					},
					template: document.getElementById("settingsTemplate").innerHTML
				}
	};
	return {build:build};
})()