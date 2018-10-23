module.exports = (function(){
	var build = function(document){
		return {
					props:{
						data:Object
					},
					computed:{
						index:function(){return this.data.index + 1;},
						name:function(){return this.data.definition.name;},
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
						},
						onChange:function(){
							this.$emit("change");
						}
					},
					watch:{
						name:function(v){
							if(this.type !== "string"){
								return;
							}
							this.$emit("namechange", v, this.data);
							if(v && !this.data.definitionExists){
								this.data.definition.add();
								this.$emit("definitioncreated");
							}
							if(!v && this.data.definitionExists){
								this.data.definition.remove();
								this.$emit("definitionremoved");
							}
						}
					},
					template:document.getElementById("columnSlotTemplate").innerHTML
				}
	};
	return {build:build};
})()