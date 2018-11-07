var DateConversion = function(data){
	this.type = "date";
	this.pattern = data.pattern || "%Y%m%d";
};
module.exports = DateConversion;