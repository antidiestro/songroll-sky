Template.layout.events = {
	'click .logout': function(){
		Meteor.logout();
	},
	'click #sky-header > .user img.avatar': function(){
		if ( $('#sky-header > .user').is('.open') ) {
			$('#sky-header > .user').removeClass('open').find('.user-menu').animate({width: 0});
		} else {
			var width = $('#sky-header > .user .user-menu').css('width', 'auto').width();
			$('#sky-header > .user .user-menu').css('width', 0);
			$('#sky-header > .user').addClass('open').find('.user-menu').animate({width: width});
		}
	},
	'mouseleave #sky-header > .user': function(){
		// Template.layout.hideUserMenu = setTimeout(function(){
		// 	$('#sky-header > .user').removeClass('open').find('.user-menu').animate({width: 'hide', opacity: 0});
		// }, 1000);
	}
}