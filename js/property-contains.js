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
							chosenVerb:"contains",
							newValue:undefined
						};
					},
					watch:{
						chosenVerb:function(v){
							if(v !== "contains"){
								this.$emit("switch", v);
							}
						}
					},
					methods:{
						addNewValue:function(){
							if(!this.newValue){
								return;
							}
							this.data.values.push(this.newValue);
							this.newValue = undefined;
						},
						onKeyDown:function(e){
							if(e.code === "Backspace" && this.data.values.length > 0 && !this.newValue){
								this.data.values.pop();
							}
						}
					},
					template:document.getElementById("propertyContainsTemplate").innerHTML
				};
	};
	return {build:build};
})()