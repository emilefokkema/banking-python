var something = function(constr, parent){
	return function(){
		var obj = constr.apply(null, arguments);
		var ff = function(){
			return obj.returnValue;
		};
		for(var p in obj){
			if(p !== "returnValue" && obj.hasOwnProperty(p)){
				ff[p] = something(obj[p], ff);
			}
		}
		ff.parent = parent;
		return ff;
	};
};

module.exports = {
	category:something(function(categoryName){
		return {
			returnValue: "{\"name\":\""+categoryName+"\",\"categories\":[]}",
			withChild: function(childCategoryName){
				return {
					returnValue: "{\"name\":\""+categoryName+"\",\"categories\":[{\"name\":\""+childCategoryName+"\",\"categories\":[]}]}",
					thatFiltersOnPropertyContains: function(nameOfPropertyToUse){
						return {
							returnValue: "{\"name\":\""+categoryName+"\",\"categories\":[{\"name\":\""+childCategoryName+"\",\"categories\":[],\"acceptRow\":{\"propertyContains\":{\"name\":\""+nameOfPropertyToUse+"\",\"values\":[]}}}]}"
						};
					},
					thatFiltersOnPropertyMatches: function(nameOfPropertyToUse){
						return {
							returnValue: "{\"name\":\""+categoryName+"\",\"categories\":[{\"name\":\""+childCategoryName+"\",\"categories\":[],\"acceptRow\":{\"propertyMatches\":{\"name\":\""+nameOfPropertyToUse+"\"}}}]}"
						};
					},
					thatCollectsRows: function(nameOfPropertyToUse){
						return {
							returnValue: "{\"name\":\""+categoryName+"\",\"categories\":[{\"name\":\""+childCategoryName+"\",\"categories\":[],\"rowCollection\":{\"properties\":[{\"name\":\""+nameOfPropertyToUse+"\",\"source\":\""+nameOfPropertyToUse+"\"}]}}]}",
							usingAPropertyWithDateConversion: function(){
								return {
									returnValue: "{\"name\":\""+categoryName+"\",\"categories\":[{\"name\":\""+childCategoryName+"\",\"categories\":[],\"rowCollection\":{\"properties\":[{\"name\":\""+nameOfPropertyToUse+"\",\"source\":\""+nameOfPropertyToUse+"\",\"conversion\":{\"type\":\"date\",\"pattern\":\"%Y%m%d\"}}]}}]}"
								};
							}
						};
					}
				};
			}
		};
	}),
	settings:something(function(){
		return {
			returnValue:"{\"rowDefinition\":{\"amount\":{\"columnIndex\":2},\"date\":{\"columnIndex\":0,\"pattern\":\"yyyymmdd\"},\"direction\":{\"columnIndex\":1,\"incoming\":\"Credit\",\"outgoing\":\"Debit\"},\"additional\":[]},\"categories\":{\"incoming\":{\"name\":\"Credit\",\"categories\":[]},\"outgoing\":{\"name\":\"Debit\",\"categories\":[]}},\"ignoreFirstLine\":true}"
		};
	})
};

