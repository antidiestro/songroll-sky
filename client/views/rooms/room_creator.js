Template.roomCreator.events({
	'submit form': function(e){
		e.preventDefault();
		var roomName = $(e.target).find('[name="roomName"]').val();
		var roomDescription = $(e.target).find('[name="roomDescription"]').val();
		var roomRecommendations = $(e.target).find('[name="roomRecommendations"]').is(':checked');
		var roomPrivacy = $(e.target).find('[name="roomPrivacy"]:checked').val();
		if ( $.trim(roomName) != "" ) {
			var isPrivate = false;
			if ( roomPrivacy == 'private' ) {
				isPrivate = true;
			}

			var data = { title: roomName, description: roomDescription, hasRecommendations: roomRecommendations, isPrivate: isPrivate };
			var newRoom = Rooms.insert(data);

			$('#roomCreator').data('nextRoom', newRoom);

			$('#roomCreator').modal('hide');
		}
	}
});

Template.roomCreator.events({
	'shown.bs.modal #roomCreator': function(){
		$('#roomCreator').data('nextRoom', false);
		$('#roomCreator [name="roomName"]').focus();
	},
	'hidden.bs.modal #roomCreator': function(){
		var nextRoom = $('#roomCreator').data('nextRoom');
		if ( nextRoom ) {
			Router.go('/rooms/'+nextRoom);
		}
	}
});