module.exports = (function(){
	var build = function(document){
		return {
			props:{
				checkedProp:Boolean,
				tooltip:String,
				tooltippos:String
			},
			model:{
				prop:"checkedProp",
				event:"input"
			},
			updated:function(){
				console.log("custom checkbox updated")
			},
			computed:{
				checked:{
					get:function(){
						return this.checkedProp;
					},
					set:function(b){
						this.$emit("input", b);
					}
				},
				pos:function(){
					return this.tooltippos || "up";
				}
			},
			template:document.getElementById("customCheckboxTemplate").innerHTML
		};
	};
	return {build:build};
})()