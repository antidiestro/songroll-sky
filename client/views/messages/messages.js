Template.messageItem.helpers({
	timeFormat: function(timestamp){
		return moment(timestamp).format('HH:mm');
	}
})

Template.messageItem.rendered = function(){
	var messagesContainer = $('.messages');
	messagesContainer.scrollTop(messagesContainer.prop('scrollHeight'));

	$('.message-list li').each(function(){
		var user_id = $(this).attr('data-user-id');
		if ( user_id && $(this).prev().attr('data-user-id') == user_id ) {
			$(this).prev().addClass('hide-info');
		}
	});
}