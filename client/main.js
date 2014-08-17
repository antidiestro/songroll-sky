Meteor.subscribe('messages');
Meteor.subscribe('rooms');
Meteor.subscribe('users');
Meteor.subscribe('videos');
Meteor.subscribe('votes');

windowWidth = $(window).width();
windowWidthDependency = new Deps.Dependency;

$(window).resize(function(){
	windowWidth = $(window).width();
	windowWidthDependency.changed();
});