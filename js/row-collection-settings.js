var regexInputBuilder = require("./regex-input.js");

module.exports = (function(){
	var build = function(document){
		return {
					props:{
						data:Object,
						propertyList:Array
					},
					methods:{
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
								source:function(){return this.property.source;},
								name:function(){return this.property.name;},
								hasStringSource:function(){
									var self = this;
									return this.propertyList.some(function(p){return p.name == self.property.source;})
								}
							},
							watch:{
								source:function(v){
									if(v === "date"){
										this.property.name = "date";
									}
									if(v == "amount"){
										this.property.name = "amount";
									}
								},
								name:function(n){
									this.$emit("change");
								}
							},
							methods:{
								onValid:function(v, msg){
									this.$emit("valid", v, msg);
								},
								onRemove:function(){
									this.property.remove();
									this.$emit("change");
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