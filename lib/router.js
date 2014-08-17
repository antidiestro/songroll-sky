Router.configure({
  layoutTemplate: 'layout'
});

if ( Meteor.isClient ) {
	nextPath = false;
	nextPathDependency = new Deps.Dependency;
}

function checkForUser(){
	if ( Meteor.isClient && !Meteor.user() ) {
		console.log('User is not logged in. Sending him to /login');
		// nextPath keeps where our user wants to go
		nextPath = Router.current().path;

		console.log('User wants to get to '+nextPath);

		// if our user goes directly to the login page, set their nextPath to root
		if ( nextPath.indexOf('/login') == 0 ) {
			nextPath = '/';
		}

		console.log('Confirmed path is '+nextPath);

		// if nextPathDependency exists, inform it has changed
		if ( nextPathDependency ) {
			console.log('Dependency found, informing change.')
			nextPathDependency.changed();
		}

		console.log('Here we go.');
		// Send the user to the login page
		Router.go('/login');
	} else if ( Meteor.isServer ) {
		console.log('User is not logged in. Sending him via server to /login');
		Router.go('/login');
	}
}

Router.map(function() {
  this.route('login', {
  	path: '/login'
  });
  this.route('roomsList', {
  	path: '/',
  	onBeforeAction: checkForUser,
  	yieldTemplates: {
  		'roomsListTitle': { to: 'pageTitle' },
  		'roomsListButtons': { to: 'pageButtons' }
  	}
  });
  this.route('roomPage', {
  	path: '/rooms/:_id',
  	onBeforeAction: checkForUser,
  	yieldTemplates: {
  		'roomsPageTitle': { to: 'pageTitle' },
  		'roomsPageButtons': { to: 'pageButtons' }
  	},
  	waitOn: function() {
  		context = Rooms.findOne(this.params._id);
  		contextDependency.changed();
  		return Meteor.subscribe('videos');
  	},
  	data: function(){ 
  		return context;
  	}
  });
});