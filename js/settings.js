var customCheckboxBuilder = require("./custom-checkbox.js");
var postget = require("./postget.js");
var columnSlot = require("./column-slot.js");
var categorySettings = require("./category-settings.js");
var Settings = require("./settings-logic.js")

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
							categorySlots:[]
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
							return this.data.rowDefinition.definitions;
						},
						canSwitch:function(){
							return this.selectedSlots.length == 2;
						},
						ignoreFirstLine:{
							get:function(){return this.data && this.data.ignoreFirstLine;},
							set:function(v){
								if(this.data){
									this.data.ignoreFirstLine = v;
								}
							}
						}
					},
					methods:{
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
									self.data = new Settings(data);
									console.log(self.data);
									self.dirty = false;
									self.saved = true;
									loading.complete();
								}else{
									self.collapsed = false;
									postget.doGet("/api/settings/default", function(data){
										self.data = new Settings(data);
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
							var slot1 = this.slots[self.selectedSlots[0]];
							var slot2 = this.slots[self.selectedSlots[1]];
							slot1.definition.columnIndex = this.selectedSlots[1];
							slot2.definition.columnIndex = this.selectedSlots[0];
							if(slot1.definitionExists || slot2.definitionExists){
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
							var numberOfSlots = this.data.rowDefinition.maxColumnIndex + 1;
							this.slots = Array.apply(null, new Array(numberOfSlots)).map(function(x, i){return self.makeSlotData(i);});
							this.determineProtection();
						},
						createCategorySlots:function(){
							var incoming = {};
							incoming.category = this.data.categories.incoming;
							incoming.exists = true;
							var outgoing = {};
							outgoing.category = this.data.categories.outgoing;
							outgoing.exists = true;
							this.categorySlots = [incoming, outgoing];
						},
						determineProtection:function(){
							for(var i=0;i<this.slots.length;i++){
								var slot = this.slots[i];
								if(!slot.definitionExists){
									continue;
								}
								slot.protected = this.data.usesProperty(slot.definition);
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
								index:index,
								protected:false,
								definitionExists:false,
								nameValid:true,
								selected:false,
								definition:this.data.rowDefinition.getNewDefinition(index)
							};
						},
						makeSlotData:function(index){
							var result = this.makeNewSlotData(index);
							var definition = this.data.rowDefinition.getDefinitionAtIndex(index);
							if(!definition){
								return result;
							}
							result.definitionExists = true;
							result.definition = definition;
							return result;
						}
					},
					template: document.getElementById("settingsTemplate").innerHTML
				}
	};
	return {build:build};
})()