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
				errorMessage:undefined
			},
			components:{
				'period-item' : {
					props:{
						data:Object,
						fileName:String
					},
					data:function(){
						return {isRemoving:false}
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
							var req = new XMLHttpRequest();
							onRequestLoaded(req, function(){
								self.$emit("removal");
							},function(msg){
								self.$emit("error", msg)
							});
							req.open("POST","api/delete");
							req.send(this.fileName)
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
				}
			},
			mounted:function(){
				this.refreshComplete();
			},
			methods:{
				refreshComplete:function(){
					var self = this;
					var req = new XMLHttpRequest();
					onRequestLoaded(req, function(data){
						console.log(data);
						self.completePeriods = data;
					},function(msg){
						self.displayError(msg);
					});
					req.open("GET","/api/complete");
					req.send();
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
						var data = reader.result;
						var req = new XMLHttpRequest();
						onRequestLoaded(req, function(data){
							self.incompletePeriods = data
								.filter(function(m){return m.file.hasBeginning;});
							self.refreshComplete();
							self.$refs.file.value = "";
						},function(msg){
							self.displayError(msg);
						});
						req.open("POST","/api/csv");
						req.send(data);
					};
					reader.readAsBinaryString(file);
				}
			}
		});
	})
})();