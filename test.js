const { exec } = require('child_process');

exec("python test.py", function(err, stdout, stderr){
	if (err) {
		console.log(err);
		return;
	}
	console.log(stderr);
});
exec("node node_modules/jasmine/bin/jasmine.js", function(err, stdout, stderr){
	if (err) {
		console.log(err);
		//return;
	}

	// the *entire* stdout and stderr (buffered)
	console.log(stdout);
	console.log(stderr);
})