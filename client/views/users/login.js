Template.login.rendered = function(){
	Template.login.redirect = Deps.autorun(function(){
		nextPathDependency.depend();
		if ( Meteor.userId() ) {
			var next_path = nextPath;
			if ( next_path ) {
				nextPath = false;
				Router.go(next_path);
			} else {
				Router.go('/');
			}
		}
	});
}


Template.login.destroyed = function(){
	Template.login.redirect.stop();
}