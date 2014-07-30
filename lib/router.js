Router.configure({
  layoutTemplate: 'layout'
});

Router.map(function() {
  this.route('roomsList', {path: '/'});
  this.route('roomPage', {
  	path: '/rooms/:_id',
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