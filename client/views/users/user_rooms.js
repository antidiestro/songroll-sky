Template.userRooms.helpers({
	myRooms: function(){
		var rooms = Rooms.find({user_id: Meteor.userId()}).fetch();
    	return processRooms(rooms);
	},
	savedRooms: function(){
		var favoriteRooms = Favorites.find({user_id: Meteor.userId(), room_id: { $exists: true }}).fetch();
		var roomIds = [];
		favoriteRooms.forEach(function(favorite){
			roomIds.push(favorite.room_id);
		});
		var rooms = Rooms.find({_id: { $in: roomIds }}).fetch();
		return processRooms(rooms);
	}
});