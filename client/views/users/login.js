Template.login.rendered = function(){
	Template.login.redirect = Deps.autorun(function(){
		nextPathDependency.depend();
		if ( Meteor.userId() ) {
			var next_path = nextPath;
			if ( next_path ) {
				nextPathDependency = false;
			} else {
				next_path = '/';
			}
			console.log(next_path);
			Router.go(next_path);
		}
	});
}


Template.login.destroyed = function(){
	Template.login.redirect.stop();
}