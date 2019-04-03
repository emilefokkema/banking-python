module.exports = (function(){
	var build = function(document){
		return {
			inject:["searcher"],
			data:function(){
				return {
					defaultPart:undefined,
					parts:[]
				};
			},
			methods:{
				makeMatchedPart:function(division, context){
					var self = this;
					var part = {found: true, text: division.text, highlighted:false};
					context.addResult({
						show:function(){
							self.$emit("show");
							part.highlighted = true;
						},
						forget:function(){
							self.reset();
						}
					});
					return part;
				},
				onSearch:function(context){
					if(!context.matches(this.text)){
						return;
					}
					var subdivided = context.subdivide(this.text);
					var parts = [];
					for(var i=0;i<subdivided.length;i++){
						var division = subdivided[i];
						var part;
						if(division.match){
							part = this.makeMatchedPart(division, context);
						}else{
							part = {found: false, text: division.text, highlighted:false};
						}
						parts.push(part);
					}
					this.parts = parts;
				},
				reset:function(){
					this.parts = [{found:false,text:this.text, highlighted: false}];
				}
			},
			mounted:function(){
				var self = this;
				this.reset();
				this.searcher.onSearch.add(function(context){self.onSearch(context);});
			},
			props:{
				text:String
			},
			template:'<span class="searchable"><span v-for="part of parts" v-bind:class="{found:part.found, highlighted:part.highlighted}">{{part.text}}</span></span>'
		};
	};
	return {build:build};
})()