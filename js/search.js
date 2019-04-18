var resultNavigator = require("./result-navigator.js");
var throttle = require("./throttle.js");

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
							numberOfResults:0,
							currentSearchContext: null
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
						this.searcher.onResult.add(function(currentSearchContext){self.currentSearchContext = currentSearchContext;});
						this.searcher.onStopSearch.add(function(){self.currentSearchContext = null;});
						this.searcher.onNoResult.add(function(){self.currentSearchContext = null;});
						this.$refs.input.addEventListener("keyup", throttle(function(){
							self.searchText = self.$refs.input.value;
						}, 20));
					},
					components:{
						'result-navigator':resultNavigator.build(document)
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
							var self = this;
							if(!this.enabled){
								return;
							}
							this.isOpen = true;
							this.$nextTick(function(){
								self.$refs.input.focus();
							});
							this.$emit("opened");
						},
						close:function(){
							this.isOpen = false;
							this.searchText = "";
							this.$emit("closed");
						},
					},
					template:document.getElementById("searchTemplate").innerHTML
				}
	};
	return {build:build};
})()