var zeroPadded = function(n, l){
	var result = n.toString();
	while(result.length < l){
		result = "0" + result;
	}
	return result;
};

module.exports = (function(){
	var build = function(document){
		return {
			props:{
				date:Date
			},
			computed:{
				formattedDate:function(){
					return this.date.toLocaleDateString("nl-NL",{day:"numeric",month:"numeric"});
				},
				title:function(){
					var result = this.date.toLocaleDateString("nl-NL",{weekday:"long"});
					var hours = this.date.getHours();
					var minutes = this.date.getMinutes();
					if(hours != 0 || minutes != 0){
						result += ", "+zeroPadded(hours, 2) + ":" + zeroPadded(minutes, 2);
					}
					return result;
				}
			},
			template: '<span v-bind:title="title" class="date">{{formattedDate}}</span>'
		};
	};
	return {build:build};
})()