Meteor.subscribe('userData');
Meteor.subscribe('indexRooms');

windowWidth = $(window).width();
windowWidthDependency = new Deps.Dependency;

$(window).resize(function(){
	windowWidth = $(window).width();
	windowWidthDependency.changed();
});