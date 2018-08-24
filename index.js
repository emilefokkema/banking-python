(function(){
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
	document.addEventListener("DOMContentLoaded",function(){
		var amount = {
			props:{
				numberOfCents:Number
			},
			computed:{
				formattedAmount:function(){
					var cents = this.numberOfCents % 100;
					var centString = (cents < 10 ? "0" : "")+cents.toString();
					var euroString = Math.floor(this.numberOfCents / 100).toString();
					return "&euro;&nbsp;"+euroString+","+centString;
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
					if(this.date.getHours() == 0 && this.date.getMinutes() == 0){
						return this.date.toLocaleDateString("nl-NL",{day:"numeric",month:"numeric"});
					}
					return this.date.toLocaleDateString("nl-NL",{day:"numeric",month:"numeric",hour:"numeric",minute:"numeric"});
				},
				dayOfWeek:function(){return this.date.toLocaleDateString("nl-NL",{weekday:"long"});}
			},
			template: '<span v-bind:title="dayOfWeek">{{formattedDate}}</span>'
		};
		new Vue({
			el:"#app",
			data:{
				completePeriods: [],
				incompletePeriods: []
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
					methods:{
						remove:function(){
							var self=this;
							this.isRemoving = true;
							console.log("removing "+this.fileName);
							var req = new XMLHttpRequest();
							req.addEventListener("load",function(){
								self.$emit("removal");
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
												row:Object
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
					req.addEventListener("load",function(){
						var data = JSON.parse(this.responseText, dateReviver);
						console.log(data);
						self.completePeriods = data;
					});
					req.open("GET","/api/complete");
					req.send();
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
						req.addEventListener("load",function(){
							var responseData = JSON.parse(this.responseText, dateReviver);
							self.incompletePeriods = responseData
								.filter(function(m){return m.hasBeginning;})
								.map(function(m){return {file:m};});
							self.refreshComplete();
							self.$refs.file.value = "";
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