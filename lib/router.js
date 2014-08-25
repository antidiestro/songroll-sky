Router.configure({
  layoutTemplate: 'layout'
});

if ( Meteor.isClient ) {
	nextPath = false;
	nextPathDependency = new Deps.Dependency;
}

Router.map(function() {
  this.route('login', {
  	path: '/login'
  });
  this.route('roomsList', {
  	path: '/',
  	yieldTemplates: {
  		'roomsListTitle': { to: 'pageTitle' },
  		'roomsListButtons': { to: 'pageButtons' }
  	}
  });
  this.route('roomPage', {
  	path: '/rooms/:_id',
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
  this.route('userFavorites', {
    path: '/favorites',
    yieldTemplates: {
      'userFavoritesTitle': { to: 'pageTitle' }
    },
    waitOn: function(){
      return Meteor.subscribe('userFavorites');
    },
    data: function(){
      return Favorites.find({user_id: Meteor.userId()});
    }
  });
  this.route('userRooms', {
    path: '/my-rooms',
    yieldTemplates: {
      'userRoomsTitle': { to: 'pageTitle' },
      'userRoomsButtons': { to: 'pageButtons' }
    },
    waitOn: function(){
      return [Meteor.subscribe('userFavorites'), Meteor.subscribe('userRooms')];
    }
  });
});