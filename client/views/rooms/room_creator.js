Template.roomCreator.events({
	'submit form': function(e){
		e.preventDefault();
		var room_name = $(e.target).find('[name="room-name"]').val();
		if ( $.trim(room_name) != "" ) {
			Rooms.insert({title: room_name});
			$('#roomCreator').modal('hide');
			console.log(room_name);
		}
	}
});

Template.roomCreator.events({
	'shown.bs.modal #roomCreator': function(){
		$('#roomCreator [name="room-name"]').focus();
	}
});