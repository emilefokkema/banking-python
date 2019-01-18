module.exports = (function(){
	var build = function(document){
		return {
					props:{
						resultContext:Object
					},
					template:document.getElementById("resultNavigatorTemplate").innerHTML
				}
	};
	return {build:build};
})()