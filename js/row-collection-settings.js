var regexInputBuilder = require("./regex-input.js");

module.exports = (function(){
	var build = function(document){
		return {
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
							this.data.addProperty();
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
								'regex-input':regexInputBuilder.build(document)
							},
							template:document.getElementById("rowPropertyTemplate").innerHTML
						}
					},
					template:document.getElementById("rowCollectionSettingsTemplate").innerHTML
				};
	};
	return {build:build};
})()