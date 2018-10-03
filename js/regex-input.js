module.exports = (function(){
	var build = function(document){
		return {
			props:{
				value:String
			},
			model:{
				prop:"value",
				event:"input"
			},
			data:function(){
				return {
					valid:true
				};
			},
			computed:{
				inputValue:{
					get:function(){
						return this.value;
					},
					set:function(v){
						this.$emit("input", v);
						try{
							var rgx = new RegExp(v);
							this.valid = true;
						}catch(e){
							this.valid = false;
						}
					}
				}
			},
			watch:{
				valid:function(v){
					this.$emit("valid", v, !v && "Please use a valid regular expression");
				}
			},
			template:document.getElementById("regexInputTemplate").innerHTML
		};
	};
	return {build:build};
})()