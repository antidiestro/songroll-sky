Template.userAvatar.rendered = function(){
	console.log('rendered');
	$('.avatar:not(.tooltip-active)').addClass('tooltip-active').tooltip();
}