module.exports = (function(){
	var build = function(document){
		return {
					props:{
						enabled:Boolean
					},
					data:function(){
						return {
							isOpen:false,
							searchText:"",
							numberOfResults:0
						}
					},
					inject:["searcher"],
					mounted:function(){
						var self = this;
						document.addEventListener("keydown",function(e){
							if(e.key == "f" && e.ctrlKey){
								e.preventDefault();
								self.open();
								return false;
							}
							if(e.key == "Escape"){
								e.preventDefault();
								self.close();
								return false;
							}
						});
					},
					watch:{
						searchText:function(v){
							if(!v){
								this.searcher.stopSearch();
								return;
							}
							this.searcher.search(v.toLowerCase());
						}
					},
					methods:{
						open:function(){
							if(!this.enabled){
								return;
							}
							this.isOpen = true;
						},
						close:function(){
							this.isOpen = false;
							this.searchText = "";
						},
					},
					template:document.getElementById("searchTemplate").innerHTML
				}
	};
	return {build:build};
})()