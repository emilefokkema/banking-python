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
			mounted:function(){
				var self = this;
				this.defaultPart = {found:false,text:this.text};
				this.parts = [this.defaultPart];
				this.searcher.onSearch.add(function(context){
					if(!context.matches(self.text)){
						return;
					}
					var subdivided = context.subdivide(self.text);
					self.parts = subdivided.map(function(p){return {found:p.match, text:p.text};})
					context.addResult({
						show:function(){
							self.$emit("show")
						},
						forget:function(){
							self.parts = [self.defaultPart];
						}
					});
				});
			},
			props:{
				text:String
			},
			template:'<span class="searchable"><span v-for="part of parts" v-bind:class="{found:part.found}">{{part.text}}</span></span>'
		};
	};
	return {build:build};
})()