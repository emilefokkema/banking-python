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
							saved:false,
							violationCount:0,
							categorySlots:[],
							cleanStringifiedSettings:undefined
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
						},
						dirty:function(){return JSON.stringify(this.data) !== this.cleanStringifiedSettings;}
					},
					methods:{
						onValid:function(v, msg){
							if(v){
								this.violationCount && this.violationCount--;
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
									self.cleanStringifiedSettings = JSON.stringify(self.data);
									self.saved = true;
									loading.complete();
								}else{
									self.collapsed = false;
									postget.doGet("/api/settings/default", function(data){
										self.data = new Settings(data);
										self.cleanStringifiedSettings = undefined;
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
						doSlotSwitch:function(){
							var self = this;
							var slot1 = this.slots[self.selectedSlots[0]];
							var slot2 = this.slots[self.selectedSlots[1]];
							slot1.definition.columnIndex = this.selectedSlots[1];
							slot2.definition.columnIndex = this.selectedSlots[0];
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
							this.createSlots();
						},
						onDefinitionRemoved:function(d){
							this.createSlots();
						},
						addNewSlot:function(){
							this.slots.push(this.makeSlotData(this.slots.length));
						},
						createSlots:function(){
							this.selectedSlots = [];
							var self = this;
							var numberOfSlots = this.data.rowDefinition.maxColumnIndex + 1;
							this.slots = Array.apply(null, new Array(numberOfSlots)).map(function(x, i){return self.makeSlotData(i);});
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