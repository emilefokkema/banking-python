module.exports = function(key, value){
	if(typeof value !== "string"){
		return value;
	}
	var match1 = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	var match2 = value.match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})$/)
	if(!match1 && !match2){
		return value;
	}
	if(match1){
		var year = parseInt(match1[1]),
			monthIndex = parseInt(match1[2])-1,
			day = parseInt(match1[3]);
		return new Date(year,monthIndex,day);
	}
	if(match2){
		var year = parseInt(match2[3]),
			monthIndex = parseInt(match2[2]) - 1,
			day = parseInt(match2[1]),
			hours = parseInt(match2[4]),
			minutes = parseInt(match2[5]);
		return new Date(year,monthIndex,day,hours,minutes);
	}
};