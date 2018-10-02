module.exports = (function(){
	var onLoggedIn = function(user){
	    // User is signed in, so display the "sign out" button and login info.
		//document.getElementById('sign-out').hidden = false;
	    console.log(`Signed in as ${user.displayName} (${user.email})`);
	    user.getIdToken().then(function (token) {
	      // Add the token to the browser's cookies. The server will then be
	      // able to verify the token against the API.
	      // SECURITY NOTE: As cookies can easily be modified, only put the
	      // token (which is verified server-side) in a cookie; do not add other
	      // user information.
	      document.cookie = "token=" + token;
	    });
	};
	var onLoggedOut = function(){
		// User is signed out.
		// Initialize the FirebaseUI Widget using Firebase.
		var ui = new firebaseui.auth.AuthUI(firebase.auth());
		// Show the Firebase login button.
		ui.start('#firebaseui-auth-container', {
		  signInSuccessUrl: '/',
		  signInOptions: [
		    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
		    firebase.auth.EmailAuthProvider.PROVIDER_ID,
		  ]
		});
		// Update the login state indicators.
		//document.getElementById('sign-out').hidden = true;
		// Clear the token cookie.
		document.cookie = "token=";
	};
	var onStateChanged = function(callback){
		firebase.auth().onAuthStateChanged(function (user) {
			if (user) {
				onLoggedIn(user);
			} else {
				onLoggedOut();
			}
			callback(user);
		}, function (error) {
		  console.log(error);
		  alert('Unable to log in: ' + error)
		});
	};
	return {
		onStateChanged:onStateChanged
	};
})();