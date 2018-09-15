(function(){
	// FirebaseUI config.
	var getFirebaseUiConfig = function(firebase){
		return {
		  signInSuccessUrl: '/',
		  signInOptions: [
		    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
		    firebase.auth.EmailAuthProvider.PROVIDER_ID,
		  ]
		};
	};
	
	var onLoggedIn = function(user){
	    // User is signed in, so display the "sign out" button and login info.
		//document.getElementById('sign-out').hidden = false;
	    console.log(`Signed in as ${user.displayName} (${user.email})`);
	    user.getIdToken().then(function (token) {
	      // Add the token to the browser's cookies. The server will then be
	      // able to verify the token against the API.
	      // SECURITY NOTE: As cookies can easily be modified, only put the
	      // token (which is verified server-side) in a cookie; do not add other
	      // user information.
	      document.cookie = "token=" + token;
	    });
	};
	var onLoggedOut = function(){
		// User is signed out.
		// Initialize the FirebaseUI Widget using Firebase.
		var ui = new firebaseui.auth.AuthUI(firebase.auth());
		// Show the Firebase login button.
		ui.start('#firebaseui-auth-container', getFirebaseUiConfig(firebase));
		// Update the login state indicators.
		//document.getElementById('sign-out').hidden = true;
		// Clear the token cookie.
		document.cookie = "token=";
	};
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
			var data;
			try{
				data = JSON.parse(this.responseText, dateReviver);
			}
			catch(e){
				errorCallback(this.responseText);
				return;
			}
			if(this.status != 200){
				if(errorCallback){
					errorCallback(data);
				}
			}else{
				dataCallback(data);
			}
		});
	};
	var TreeNode = function(){
		Object.defineProperty(this, 'children', {value:[]});
	};
	TreeNode.prototype.add = function(n, blockReciprocate){
		this.children.push(n);
		if(!blockReciprocate){
			n.add(this, true);
		}
	};
	TreeNode.prototype.some = function(predicate, except){
		if(predicate(this)){
			return true;
		}
		for(var i=0;i<this.children.length;i++){
			var child = this.children[i];
			if(child != except && child.some(predicate, this)){
				return true;
			}
		}
		return false;
	};
	TreeNode.prototype.remove = function(n){
		var index = this.children.indexOf(n);
		if(index > -1){
			this.children.splice(index, 1);
		}
	};
	TreeNode.prototype.destroy = function(){
		for(var i=0;i<this.children.length;i++){
			this.children[i].remove(this);
		}
		this.children.splice(0, this.children.length);
	};
	var Complete = function(parent){
		Object.defineProperty(this, 'parent', {value:parent});
		Object.defineProperty(this, 'incompletes', {value:[]});
	};
	Complete.prototype.onComplete = function(completeCallback){
		this.completeCallback = completeCallback;
	};
	Complete.prototype.onIncomplete = function(incompleteCallback){
		this.incompleteCallback = incompleteCallback;
	};
	Complete.prototype.returnIncomplete = function(incomplete){
		var index = this.incompletes.indexOf(incomplete);
		if(index == -1){
			return;
		}
		this.incompletes.splice(index, 1);
		if(this.isComplete()){
			this.complete();
		}
	};
	Complete.prototype.getIncomplete = function(){
		var incomplete = new Complete(this);
		this.incompletes.push(incomplete);
		this.incompleteCallback && this.incompleteCallback();
		return incomplete;
	};
	Complete.prototype.complete = function(){
		if(this.incompletes.length > 0){
			console.error("can't complete before all incompletes are complete");
		}
		this.completeCallback && this.completeCallback();
		this.parent && this.parent.returnIncomplete(this);
	};
	Complete.prototype.isComplete = function(){
		return this.incompletes.length == 0;
	};
	window.addEventListener("load",function(){
		// document.getElementById('sign-out').onclick = function () {
		//   firebase.auth().signOut();
		// };
		

		
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
		var regexInput = {
			props:{
				value:String
			},
			model:{
				prop:"value",
				event:"input"
			},
			data:function(){
				return {
					valid:true
				};
			},
			computed:{
				inputValue:{
					get:function(){
						return this.value;
					},
					set:function(v){
						this.$emit("input", v);
						try{
							var rgx = new RegExp(v);
							this.valid = true;
						}catch(e){
							this.valid = false;
						}
					}
				}
			},
			watch:{
				valid:function(v){
					this.$emit("valid", v, !v && "Please use a valid regular expression");
				}
			},
			template:document.getElementById("regexInputTemplate").innerHTML
		};
		var customCheckbox = {
			props:{
				checkedProp:Boolean
			},
			model:{
				prop:"checkedProp",
				event:"input"
			},
			updated:function(){
				console.log("custom checkbox updated")
			},
			computed:{
				checked:{
					get:function(){
						return this.checkedProp;
					},
					set:function(b){
						this.$emit("input", b);
					}
				}
			},
			template:document.getElementById("customCheckboxTemplate").innerHTML
		};
		new Vue({
			el:"#app",
			data:{
				completePeriods: [],
				incompleteBeginningPeriods: [],
				incompleteEndingPeriods:[],
				errorMessage:undefined,
				fileName:undefined,
				settingsDirty:false,
				settingsSaved:false,
				loggedIn:false,
				loading:false,
				loadingStatus: new Complete()
			},
			components:{
				'period-item' : {
					props:{
						data:Object,
						fileName:String,
						loadingstatus: Object
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
							var loading = this.loadingstatus.getIncomplete();
							doPost("api/delete", this.fileName, function(){
								self.$emit("removal", self.fileName);
								loading.complete();
							},function(msg){
								self.$emit("error", msg);
								loading.complete();
							});
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
												row:Object
											},
											computed:{
												dateProperty:function(){
													return this.row.properties.find(function(p){return p.type == 'date';})
												},
												amountProperty:function(){
													return this.row.properties.find(function(p){return p.type == 'amount';})
												},
												stringProperties:function(){
													return this.row.properties.filter(function(p){return p.type == 'string';})
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
					props:{
						loadingstatus: Object
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
						'column-slot':{
							props:{
								data:Object
							},
							computed:{
								name:function(){return this.data.definition.name;},
								index:function(){return this.data.definition.columnIndex;},
								protected:function(){return this.data.protected;},
								nameInvalid:function(){return this.data && !this.data.nameValid;}
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
									this.$emit("namechange", v, this.data);
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
								propertyList:Array
							},
							methods:{
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
									return this.createCategorySlot({name:undefined}, false);
								},
								createCategorySlot:function(category, exists){
									var key = this.nextKey();
									var newSlot = new TreeNode();
									this.data.add(newSlot);
									newSlot.category = category;
									newSlot.exists = exists;
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
										result = this.data.category.categories.map(function(cat){return self.createCategorySlot(cat, true);});
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
								'property-contains':{
									props:{
										data:Object,
										propertyList:Array
									},
									data:function(){
										return {
											verbs:["contains","matches"],
											chosenVerb:"contains",
											newValue:undefined
										};
									},
									watch:{
										chosenVerb:function(v){
											if(v !== "contains"){
												this.$emit("switch", v);
											}
										}
									},
									methods:{
										addNewValue:function(){
											if(!this.newValue){
												return;
											}
											this.data.values.push(this.newValue);
											this.newValue = undefined;
											this.$emit("change");
										},
										onKeyDown:function(e){
											if(e.code === "Backspace" && this.data.values.length > 0){
												this.data.values.pop();
												this.$emit("change");
											}
										}
									},
									template:document.getElementById("propertyContainsTemplate").innerHTML
								},
								'property-matches':{
									props:{
										data:Object,
										propertyList:Array
									},
									data:function(){
										return {
											verbs:["contains","matches"],
											chosenVerb:"matches"
										};
									},
									components:{
										'regex-input':regexInput
									},
									methods:{
										onValid:function(v, msg){
											this.$emit("valid", v, msg);
										}
									},
									watch:{
										chosenVerb:function(v){
											if(v !== "matches"){
												this.$emit("switch", v);
											}
										}
									},
									template:document.getElementById("propertyMatchesTemplate").innerHTML
								},
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
								'custom-checkbox':customCheckbox
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
								}
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
									usedFilters:{}
								}
							},
							template:document.getElementById("categorySettingsTemplate").innerHTML
						},
						'custom-checkbox':customCheckbox
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
							doGet("/api/settings",function(data){
								if(data){
									self.data = data;
									self.dirty = false;
									self.saved = true;
									loading.complete();
								}else{
									self.collapsed = false;
									doGet("/api/settings/default", function(data){
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
							doPost("/api/settings", JSON.stringify(this.data), function(){
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
			},
			mounted:function(){
				var self = this;
				firebase.auth().onAuthStateChanged(function (user) {
				  if (user) {
				   onLoggedIn(user);
				   self.refreshComplete();
				   self.loggedIn = true;
				  } else {
				  	self.loggedIn = false;
				    onLoggedOut();
				  }
				}, function (error) {
				  console.log(error);
				  alert('Unable to log in: ' + error)
				});
				
				
			},
			created:function(){
				var self = this;
				this.loadingStatus.onComplete(function(){self.loading = false;});
				this.loadingStatus.onIncomplete(function(){self.loading = true;})
			},
			computed:{
				earliestCompleteDate:function(){
					if(this.completePeriods.length == 0){
						return undefined;
					}
					return Math.min.apply(null, this.completePeriods.map(function(p){return p.file.from;}));
				}
			},
			methods:{
				signOut:function(){
					firebase.auth().signOut();
				},
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
					var loading = this.loadingStatus.getIncomplete();
					doGet("/api/complete",function(data){
						self.addCompletePeriods(data);
						loading.complete();
					},function(msg){
						self.displayError(msg);
						loading.complete();
					});
				},
				onRemovePeriod:function(fileName){
					this.completePeriods = this.completePeriods.filter(function(p){return p.fileName !== fileName;});
				},
				periodComplement:function(plusPeriods, minusPeriods){
					return plusPeriods.filter(function(p){return !minusPeriods.some(function(pp){return p.fileName == pp.fileName;});});
				},
				addCompletePeriods:function(completePeriods){
					this.completePeriods = this.completePeriods.concat(this.periodComplement(completePeriods, this.completePeriods));
				},
				displayError:function(msg){
					this.errorMessage = msg || "Internal Server Error";
				},
				clearError:function(){
					this.errorMessage = undefined;
				},
				postCsv:function(){
					var files = this.$refs.file.files;
					if(files.length == 0){return;}
					var file = files[0];
					var self = this;
					var reader = new FileReader();
					var loading = this.loadingStatus.getIncomplete();
					reader.onload = function(){
						doPost("/api/csv", reader.result, function(data){
							var complete = data.filter(function(p){return p.file.hasBeginning && p.file.hasEnd;});
							self.incompleteBeginningPeriods = data.filter(function(p){return p.file.hasBeginning && !p.file.hasEnd;});
							var incompleteEndingPeriods = data.filter(function(p){return !p.file.hasBeginning && p.file.hasEnd;});
							if(self.earliestCompleteDate){
								self.incompleteEndingPeriods = incompleteEndingPeriods.filter(function(p){return p.file.through < self.earliestCompleteDate;})
							}else{
								self.incompleteEndingPeriods = incompleteEndingPeriods;
							}
							self.addCompletePeriods(complete);
							self.$refs.file.value = "";
							self.fileName = "";
							loading.complete();
						},function(msg){
							self.displayError(msg);
							loading.complete();
						});
					};
					reader.readAsBinaryString(file);
				}
			}
		});
	})
})();