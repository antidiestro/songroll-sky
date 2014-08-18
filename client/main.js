Meteor.subscribe('userData');
Meteor.subscribe('indexRooms');

windowWidth = $(window).width();
windowWidthDependency = new Deps.Dependency;


$(function(){
	$(window).resize(function(){
		windowWidth = $(window).width();
		windowWidthDependency.changed();
	});
	$(document).on('mousewheel', '.proposed-videos-list', function(event, delta) {
		this.scrollLeft -= delta;
		event.preventDefault();
	});
});