Template.messageItem.helpers({
	timeFormat: function(timestamp){
		return moment(timestamp).format('HH:mm');
	}
})

Template.messageItem.rendered = function(){
	var messagesContainer = $('.messages');
	messagesContainer.scrollTop(messagesContainer.prop('scrollHeight'));

	$('.messages li').each(function(){
		var user_id = $(this).attr('data-user-id');
		if ( $(this).prev().attr('data-user-id') == user_id ) {
			$(this).prev().find('.info').remove();
			$(this).prev().css({ 'margin-bottom': '4px' })
		}
	});
}