var regexInputBuilder = require("./regex-input.js");

module.exports = (function(){
	var build = function(document){
		return {
					props:{
						data:Object,
						propertyList:Array
					},
					data:function(){
						return {
							verbs:["contains","matches"],
							chosenVerb:"matches"
						};
					},
					components:{
						'regex-input':regexInputBuilder.build(document)
					},
					methods:{
						onValid:function(v, msg){
							this.$emit("valid", v, msg);
						}
					},
					watch:{
						chosenVerb:function(v){
							if(v !== "matches"){
								this.$emit("switch", v);
							}
						}
					},
					template:document.getElementById("propertyMatchesTemplate").innerHTML
				};
	};
	return {build:build};
})()