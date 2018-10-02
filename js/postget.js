var dateReviver = require("./date-reviver.js");

module.exports = (function(){
	var onRequestLoaded = function(req, dataCallback, errorCallback){
		req.addEventListener("load",function(){
			var data;
			try{
				data = JSON.parse(this.responseText, dateReviver);
			}
			catch(e){
				errorCallback(this.responseText);
				return;
			}
			if(this.status != 200){
				if(errorCallback){
					errorCallback(data);
				}
			}else{
				dataCallback(data);
			}
		});
	};
	var doGet = function(url, dataCallback, errorCallback){
		var req = new XMLHttpRequest();
		onRequestLoaded(req, dataCallback, errorCallback);
		req.open("GET",url);
		req.send();
	};
	var doPost = function(url, data, dataCallback, errorCallback){
		var req = new XMLHttpRequest();
		onRequestLoaded(req, dataCallback, errorCallback);
		req.open("POST",url);
		req.send(data);
	};
	return {
		doPost:doPost,
		doGet:doGet
	};
})()