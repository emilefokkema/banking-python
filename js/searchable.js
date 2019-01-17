module.exports = (function(){
	var build = function(document){
		return {
			inject:["searcher"],
			mounted:function(){
				var self = this;
				this.searcher.onSearch(function(context, phrase){
					if(self.text.toLowerCase().indexOf(phrase) == -1){
						return;
					}
					console.log("found "+phrase+" in "+self.text);
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