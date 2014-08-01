Router.configure({
  layoutTemplate: 'layout'
});

if ( Meteor.isClient ) {
	nextPath = false;
	nextPathDependency = new Deps.Dependency;
}

function checkForUser(){
	if ( !Meteor.user() ) {
		if ( Meteor.isClient ) {
			nextPath = Router.current().path;
			nextPathDependency.changed();
		}
		Router.go('/login');
	}
}

Router.map(function() {
  this.route('login', {
  	path: '/login'
  });
  this.route('roomsList', {
  	path: '/',
  	onBeforeAction: checkForUser
  });
  this.route('roomPage', {
  	path: '/rooms/:_id',
  	onBeforeAction: checkForUser,
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