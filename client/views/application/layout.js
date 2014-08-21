Template.layout.events = {
	'click .logout': function(){
		Meteor.logout();
	},
	'mouseenter #sky-header > .user': function(){
		if ( Template.layout.hideUserMenu ) {
			clearTimeout(Template.layout.hideUserMenu);
		}
		$('#sky-header .user .user-menu').animate({width: 'show', paddingLeft: 10});
	},
	'mouseleave #sky-header > .user': function(){
		Template.layout.hideUserMenu = setTimeout(function(){
			$('#sky-header .user .user-menu').animate({width: 'hide', paddingLeft: 0});
		}, 2500);
	}
}