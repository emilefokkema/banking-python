module.exports = (function(){
	var build = function(document){
		return {
			inject:["searcher"],
			mounted:function(){
				var self = this;
				this.searcher.onSearch.add(function(context, phrase){
					if(self.text.toLowerCase().indexOf(phrase) == -1){
						return;
					}
					context.addResult({
						show:function(){
							self.$emit("show")
						}
					});
				});
			},
			props:{
				text:String
			},
			template:'<span class="searchable">{{text}}</span>'
		};
	};
	return {build:build};
})()