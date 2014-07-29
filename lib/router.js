Router.configure({
  layoutTemplate: 'layout'
});

Router.map(function() {
  this.route('roomsList', {path: '/'});
  this.route('roomPage', {
  	path: '/rooms/:_id',
  	waitOn: function() {
  		return Meteor.subscribe('videos');
  	},
  	data: function(){ return Rooms.findOne(this.params._id); }
  });
});