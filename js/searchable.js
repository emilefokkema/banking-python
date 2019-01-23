var subdivide = function(text, searchPhrase){
	var searchPattern = searchPhrase ? searchPhrase.replace(/[-$()*+.\/?[\\\]^{|}]/g, '\\$&') : "[^\\w\\W]";
	var result = [];
	var replacePattern = "("+searchPattern+")|((?:(?!"+searchPattern+").)+)";
	text.replace(new RegExp(replacePattern, "ig"), function(match, foundGroup, notFoundGroup){
		if(foundGroup){
			result.push({
				found:true,
				text:match
			});
		}else{
			result.push({
				found:false,
				text:match
			});
		}
	});
	return result;
};
module.exports = (function(){
	var build = function(document){
		return {
			inject:["searcher"],
			data:function(){
				return {
					searchPhrase:undefined
				};
			},
			computed:{
				parts:function(){return subdivide(this.text || "", this.searchPhrase);}
			},
			mounted:function(){
				var self = this;
				this.searcher.onSearch.add(function(context, phrase){
					if(self.text.toLowerCase().indexOf(phrase) == -1){
						return;
					}
					self.searchPhrase = phrase;
					context.addResult({
						show:function(){
							self.$emit("show")
						},
						forget:function(){
							self.searchPhrase = "";
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