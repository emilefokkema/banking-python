module.exports = (function(){
	var build = function(document){
		return {
					props:{
						resultContext:Object
					},
					methods:{
						moveUp:function(){this.resultContext.moveUp();},
						moveDown:function(){this.resultContext.moveDown();}
					},
					template:document.getElementById("resultNavigatorTemplate").innerHTML
				}
	};
	return {build:build};
})()