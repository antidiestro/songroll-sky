Template.roomCreator.events({
	'submit form': function(e){
		e.preventDefault();
		var room_name = $(e.target).find('[name="roomName"]').val();
		if ( $.trim(room_name) != "" ) {
			var roomId = Rooms.insert({title: room_name});
			$('#roomCreator').modal('hide');
		}
	}
});

Template.roomCreator.events({
	'shown.bs.modal #roomCreator': function(){
		$('#roomCreator [name="roomName"]').focus();
	}
});