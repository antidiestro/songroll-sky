Template.layout.rendered = function(){
	if ( !Meteor.userId() ) {
		$('#welcomeModal').modal('show');
	}

	Deps.autorun(function(){
		if ( Meteor.userId() ) {
			$('#loginModal, #welcomeModal').modal('hide');
		}
	});
}

Template.layout.events = {
	'click #login': function(){
		$('#loginModal').modal('show');
	},
	'click #loginWithTwitter': function(){
		Meteor.loginWithTwitter();
	},
	'click .logout': function(){
		Meteor.logout();
	},
	'click #sky-header > .user .menu-avatar-toggle': function(){
		if ( !$('#sky-header > .user').is('.open') ) { 
			var width = $('#sky-header > .user .user-menu').css('width', 'auto').width();
			$('#sky-header > .user .user-menu').css('width', 0);
			$('#sky-header > .user').addClass('open').find('.user-menu').animate({width: width});
		}
	},
	'click #sky-header > .user .close-menu': function(){
		$('#sky-header > .user').removeClass('open').find('.user-menu').animate({width: 0});
	},
	'click #sky-header > .user .user-menu a': function(){
		$('#sky-header > .user').removeClass('open').find('.user-menu').animate({width: 0});
	}
}