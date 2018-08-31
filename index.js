(function(){
	var zeroPadded = function(n, l){
		var result = n.toString();
		while(result.length < l){
			result = "0" + result;
		}
		return result;
	};
	var dateReviver = function(key, value){
		if(typeof value !== "string"){
			return value;
		}
		var match1 = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
		var match2 = value.match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})$/)
		if(!match1 && !match2){
			return value;
		}
		if(match1){
			var year = parseInt(match1[1]),
				monthIndex = parseInt(match1[2])-1,
				day = parseInt(match1[3]);
			return new Date(year,monthIndex,day);
		}
		if(match2){
			var year = parseInt(match2[3]),
				monthIndex = parseInt(match2[2]) - 1,
				day = parseInt(match2[1]),
				hours = parseInt(match2[4]),
				minutes = parseInt(match2[5]);
			return new Date(year,monthIndex,day,hours,minutes);
		}
	};
	var doGet = function(url, dataCallback, errorCallback){
		var req = new XMLHttpRequest();
		onRequestLoaded(req, dataCallback, errorCallback);
		req.open("GET",url);
		req.send();
	};
	var doPost = function(url, data, dataCallback, errorCallback){
		var req = new XMLHttpRequest();
		onRequestLoaded(req, dataCallback, errorCallback);
		req.open("POST",url);
		req.send(data);
	};
	var onRequestLoaded = function(req, dataCallback, errorCallback){
		req.addEventListener("load",function(){
			var data = JSON.parse(this.responseText, dateReviver);
			if(this.status != 200){
				if(errorCallback){
					errorCallback(data);
				}
			}else{
				dataCallback(data);
			}
		});
	};
	document.addEventListener("DOMContentLoaded",function(){
		var amount = {
			props:{
				numberOfCents:Number
			},
			computed:{
				formattedAmount:function(){
					return (this.numberOfCents/100).toLocaleString("nl-NL",{style:"currency",currency:"EUR"})
				}
			},
			template:'<span class="amount" v-html="formattedAmount"></span>'
		};
		var date = {
			props:{
				date:Date
			},
			computed:{
				formattedDate:function(){
					return this.date.toLocaleDateString("nl-NL",{day:"numeric",month:"numeric"});
				},
				title:function(){
					var result = this.date.toLocaleDateString("nl-NL",{weekday:"long"});
					var hours = this.date.getHours();
					var minutes = this.date.getMinutes();
					if(hours != 0 || minutes != 0){
						result += ", "+zeroPadded(hours, 2) + ":" + zeroPadded(minutes, 2);
					}
					return result;
				}
			},
			template: '<span v-bind:title="title" class="date">{{formattedDate}}</span>'
		};
		new Vue({
			el:"#app",
			data:{
				completePeriods: [],
				incompletePeriods: [],
				errorMessage:undefined,
				fileName:undefined,
				settingsDirty:false
			},
			components:{
				'period-item' : {
					props:{
						data:Object,
						fileName:String
					},
					data:function(){
						return {
							isRemoving:false,
							collapsed:true
						}
					},
					computed:{
						periodDescription:function(){
							return this.data.from.toLocaleDateString("nl-NL",{day:"numeric",month:"long"}) + " - " + this.data.through.toLocaleDateString("nl-NL",{day:"numeric",month:"long"});
						}
					},
					methods:{
						remove:function(){
							var self=this;
							this.isRemoving = true;
							console.log("removing "+this.fileName);
							doPost("api/delete", this.fileName, function(){self.$emit("removal");},function(msg){self.$emit("error", msg);});
						},
						toggleCollapse:function(){
							this.collapsed = !this.collapsed
						}
					},
					components:{
						'category':{
							name:'category',
							props:{
								top:Boolean,
								categoryData:Object
							},
							computed:{
								isSimple:function(){return !this.categoryData.rows && !this.categoryData.categories;}
							},
							methods:{
								toggleCollapse:function(){this.collapsed = !this.collapsed;}
							},
							components: {
								'row-collection':{
									props:{
										data:Object
									},
									components:{
										'row':{
											props:{
												row:Array
											},
											computed:{
												dateProperty:function(){
													return this.row.find(function(p){return p.type == 'date';})
												},
												amountProperty:function(){
													return this.row.find(function(p){return p.type == 'amount';})
												},
												stringProperties:function(){
													return this.row.filter(function(p){return p.type == 'string';})
												}
											},
											components:{
												'amount':amount,
												'date':date
											},
											template: document.getElementById("rowTemplate").innerHTML
										}
									},
									template:document.getElementById("rowCollectionTemplate").innerHTML
								},
								'amount':amount,
								'expectation':{
									props:{
										expectation:Object
									},
									computed:{
										dateSummary:function(){
											return this.expectation.dates.map(function(d){return d.toLocaleDateString("nl-NL",{day:"numeric",month:"long"});}).join(', ');
										}
									},
									template:document.getElementById("expectationTemplate").innerHTML
								}
							},
							data:function(){
								return {collapsed:true};
							},
							template:document.getElementById("categoryTemplate").innerHTML
						},
						'date':date,
						'remove-button':{
							methods:{
								click:function(){
									this.$emit("click");
								}
							},
							template:document.getElementById("removeButtonTemplate").innerHTML
						}
					},
					template:document.getElementById("periodItemTemplate").innerHTML
				},
				'settings':{
					data:function(){
						return {
							data: undefined,
							collapsed:true,
							slots:[],
							selectedSlots:[],
							dirty:false,
							saved:false
						};
					},
					mounted:function(){
						this.getSettings();
					},
					updated:function(){
						if(this.dirty && !this.saved){
							this.$refs.incoming.collapsed = false;
							this.$refs.outgoing.collapsed = false;
						}
					},
					components:{
						'column-slot':{
							props:{
								data:Object
							},
							computed:{
								name:function(){return this.data.definition.name;},
								index:function(){return this.data.definition.columnIndex;},
								protected:function(){return this.data.protected;}
							},
							methods:{
								onClick:function(e){
									if(e.target.nodeName.toLowerCase() !== "input"){
										if(!this.data.selected){
											this.$emit("selected", this.index);
										}else{
											this.$emit("deselected", this.index);
										}
									}
								},
								onChange:function(){
									this.$emit("change");
								}
							},
							watch:{
								name:function(v){
									if(v && !this.data.definitionExists){
										this.$emit("definitioncreated", this.data.definition);
									}
									if(!v && this.data.definitionExists){
										this.$emit("definitionremoved",this.data.definition);
									}
								}
							},
							template:document.getElementById("columnSlotTemplate").innerHTML
						},
						'category-settings':{
							name:'category-settings',
							props:{
								top:Boolean,
								data:Object,
								allowNewCategories:Boolean,
								propertyList:Array
							},
							methods:{
								toggleCollapse:function(){
									this.collapsed = !this.collapsed;
								},
								changed:function(){
									this.$emit("changed");
								},
								randomKey:function(){
									return Math.floor(1000 * Math.random());
								},
								createNewCategorySlot:function(){
									return this.createCategorySlot({name:undefined}, false);
								},
								createCategorySlot:function(category, exists){
									var key = this.randomKey();
									return {category:category, exists:exists, key:key};
								},
								createCategorySlots:function(){
									var self = this;
									var result = [];
									if(this.data.category.categories){
										result = this.data.category.categories.map(function(cat){return self.createCategorySlot(cat, true);});
									}
									if(this.allowNewCategories){
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
								'property-contains':{
									props:{
										data:Object,
										propertyList:Array
									},
									template:document.getElementById("propertyContainsTemplate").innerHTML
								}
							},
							computed:{
								name:function(){return this.data.category.name;}
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
								allowNewCategories:function(v){
									this.createCategorySlots();
								}
							},
							data:function(){
								return {
									collapsed:true,
									categorySlots:[],
									newCategorySlot:undefined
								}
							},
							template:document.getElementById("categorySettingsTemplate").innerHTML
						}
					},
					watch:{
						data:function(v){
							this.createSlots();
						},
						dirty:function(v){
							if(v){
								this.$emit("settingsdirty");
							}else{
								this.$emit("settingsclean");
							}
						}
					},
					computed:{
						definitions:function(){
							return [this.data.rowDefinition.amount, this.data.rowDefinition.date, this.data.rowDefinition.direction].concat(this.data.rowDefinition.additional);
						},
						canSwitch:function(){
							return this.selectedSlots.length == 2;
						},
						incoming:function(){return {category:this.data.categories.incoming,exists:true};},
						outgoing:function(){return {category:this.data.categories.outgoing,exists:true};},
						allowNewCategories:function(){return this.data.rowDefinition.additional.length > 0;}
					},
					methods:{
						getSettings:function(){
							var self = this;
							doGet("/api/settings",function(data){
								if(data){
									self.data = data;
									self.dirty = false;
									self.saved = true;
								}else{
									self.collapsed = false;
									doGet("/api/settings/default", function(data){
										self.data = data;
										self.dirty = true;
										self.saved = false;
									}, function(msg){self.$emit("error",msg);})
								}
							},function(msg){self.$emit("error",msg);});
						},
						onChanged:function(){
							this.dirty = true;
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
						usesProperty:function(cat, propertyName){
							var self = this;
							if(cat.acceptRow && cat.acceptRow.propertyContains && cat.acceptRow.propertyContains.name == propertyName){
								return true;
							}
							if(cat.acceptRow && cat.acceptRow.propertyMatches && cat.acceptRow.propertyMatches.name == propertyName){
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
							doPost("/api/settings", JSON.stringify(this.data), function(){
								self.getSettings();
							}, function(msg){self.$emit("error",msg);});
						},
						toggleCollapse:function(){
							this.collapsed = !this.collapsed;
						},
						makeNewSlotData:function(index){
							return {
								protected:false,
								definitionExists:false,
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
								definitionExists:true,
								type:type,
								definition:definition,
								selected:false
							};
						}
					},
					template: document.getElementById("settingsTemplate").innerHTML
				}
			},
			mounted:function(){
				this.refreshComplete();
				
			},
			methods:{
				setSettingsDirty:function(){
					this.settingsDirty = true;
				},
				setSettingsClean:function(){
					this.settingsDirty = false;
				},
				fileNameChange:function(){
					this.fileName = this.$refs.file.files[0].name;
				},
				refreshComplete:function(){
					var self = this;
					doGet("/api/complete",function(data){
						self.completePeriods = data;
					},function(msg){self.displayError(msg);});
				},
				displayError:function(msg){
					this.errorMessage = msg || "Internal Server Error";
				},
				postCsv:function(){
					var files = this.$refs.file.files;
					if(files.length == 0){return;}
					var file = files[0];
					var self = this;
					var reader = new FileReader();
					reader.onload = function(){
						doPost("/api/csv", reader.result, function(data){
							self.incompletePeriods = data
								.filter(function(m){return m.file.hasBeginning;});
							self.refreshComplete();
							self.$refs.file.value = "";
							self.fileName = "";
						},function(msg){self.displayError(msg);});
					};
					reader.readAsBinaryString(file);
				}
			}
		});
	})
})();