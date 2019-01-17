var amountBuilder = require("./amount.js");
var dateBuilder = require("./date.js");
var postget = require("./postget.js");
var searchable = require("./searchable.js")
module.exports = (function(){
	var build = function(document){
		var amount = amountBuilder.build(document);
		var date = dateBuilder.build(document);
		return {
					props:{
						initialData:Object,
						fileName:String,
						loadingstatus: Object
					},
					data:function(){
						return {
							isRemoving:false,
							collapsed:true,
							retrievedData:undefined
						}
					},
					mounted:function(){
						var self = this;
						if(!this.data){
							console.log("No data! going to get period '"+this.fileName+"'");
							var loading = this.loadingstatus.getIncomplete();
							postget.doGet("api/period/"+this.fileName, function(data){
								self.retrievedData = data;
								loading.complete();
							},function(msg){
								self.$emit("error", msg);
								loading.complete();
							});
						}
					},
					computed:{
						periodDescription:function(){
							return this.data.from.toLocaleDateString("nl-NL",{day:"numeric",month:"long"}) + " - " + this.data.through.toLocaleDateString("nl-NL",{day:"numeric",month:"long"});
						},
						hasBeginning:function(){
							return this.data && this.data.hasBeginning;
						},
						hasEnd:function(){
							return this.data && this.data.hasEnd;
						},
						data:function(){
							return this.initialData || this.retrievedData;
						}
					},
					methods:{
						remove:function(){
							var self=this;
							this.isRemoving = true;
							console.log("removing "+this.fileName);
							var loading = this.loadingstatus.getIncomplete();
							postget.doPost("api/delete", this.fileName, function(){
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
								},
								'searchable':searchable.build(document)
							},
							data:function(){
								return {collapsed:true};
							},
							template:document.getElementById("categoryTemplate").innerHTML
						},
						'date':date,
						'amount':amount,
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
				};
	};
	return {build:build};
})()