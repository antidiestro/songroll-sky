Router.configure({
  layoutTemplate: 'layout'
});

if ( Meteor.isClient ) {
	nextPath = false;
	nextPathDependency = new Deps.Dependency;
}

function checkForUser(){
	if ( Meteor.isClient && !Meteor.user() ) {
		// nextPath keeps where our user wants to go
		nextPath = Router.current().path;

		// if our user goes directly to the login page, set their nextPath to root
		if ( nextPath.indexOf('/login') == 0 ) {
			nextPath = '/';
		}

		// if nextPathDependency exists, inform it has changed
		if ( nextPathDependency ) {
			nextPathDependency.changed();
		}

		// Send the user to the login page
		Router.go('/login');
	} else if ( Meteor.isServer ) {
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
  		return Meteor.subscribe('room', this.params._id);
  	},
  	data: function(){ 
      // Cambiar por Session
      context = Rooms.findOne(this.params._id);
      contextDependency.changed();
  		return context;
  	}
  });
});