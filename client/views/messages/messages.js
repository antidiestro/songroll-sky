Template.messageItem.helpers({
	activityText: function(){
		var user = Meteor.users.findOne({_id: this.user_id});
		if ( this.activityType == 'join' ) {
			return '<strong>'+user.name+'</strong> has joined the room.';
		} else if ( this.activityType == 'leave' ) {
			return '<strong>'+user.name+'</strong> has left the room.';
		} else if ( this.activityType == 'addVideo' ) {
			var video = Videos.findOne({_id: this.video_id});
			return '<strong>'+user.name+'</strong> has added <strong>"'+video.title+'"</strong> to the playlist.';
		}
	},
	timeFormat: function(timestamp){
		return moment(timestamp).format('HH:mm');
	}
})

Template.messageItem.rendered = function(){
	var messagesContainer = $('.room-messages');
	messagesContainer.scrollTop(messagesContainer.prop('scrollHeight'));

	$('.message-list li').each(function(){
		var user_id = $(this).attr('data-user-id');
		if ( user_id && $(this).prev().attr('data-user-id') == user_id ) {
			$(this).prev().addClass('hide-info');
		}
	});
}