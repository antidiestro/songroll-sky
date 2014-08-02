Template.login.rendered = function(){
	console.log('Login page rendered');
	Template.login.redirect = Deps.autorun(function(){
		nextPathDependency.depend();
		if ( Meteor.user() ) {
			console.log('User is NOW logged in.');
			console.log('nextPath is '+nextPath);
			if ( nextPath == false ) {
				nextPath = '/';
			}
			console.log('Going to '+nextPath+' now.');
			Router.go(nextPath);
		} else {
			console.log('User is not logged in yet. Waiting.')
		}
	});
}


Template.login.destroyed = function(){
	console.log('Login page destroyed.');
	// After our user leaves, stop monitoring for their login and nextPath.
	Template.login.redirect.stop();

	console.log('Setting nextPath to false.');
	// And empty that stupid nextPath variable.
	nextPath = false;
}