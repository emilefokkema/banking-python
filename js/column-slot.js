module.exports = (function(){
	var build = function(document){
		return {
					props:{
						data:Object
					},
					data:function(){
						return {
							invalidName:undefined
						};
					},
					computed:{
						index:function(){return this.data.index + 1;},
						name:{
							get:function(){return this.invalidName || this.data.definition.name;},
							set:function(v){
								try{
									this.data.definition.name = v;
									this.invalidName = undefined;
									this.data.nameValid = true;
									this.$emit("valid", true);
								}catch(e){
									this.data.nameValid = false;
									this.invalidName = v;
									this.$emit("valid", false, e.message);
								}
							}
						},
						nameInvalid:function(){return this.data && !this.data.nameValid;},
						type:function(){return this.data.definition.type;}
					},
					methods:{
						onClick:function(e){
							if(e.target.nodeName.toLowerCase() !== "input"){
								if(!this.data.selected){
									this.$emit("selected", this.data.index);
								}else{
									this.$emit("deselected", this.data.index);
								}
							}
						}
					},
					watch:{
						name:function(v){
							if(this.type !== "string"){
								return;
							}
							if(v && !this.data.definitionExists){
								this.$emit("definitioncreated");
							}
							if(!v && this.data.definitionExists){
								this.$emit("definitionremoved");
							}
						}
					},
					template:document.getElementById("columnSlotTemplate").innerHTML
				}
	};
	return {build:build};
})()