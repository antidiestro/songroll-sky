Meteor.publish('userData', function () {
    return Meteor.users.find({_id: this.userId});
});

Meteor.publish('userFavorites', function(){
	return Favorites.find({user_id: this.userId});
});

Meteor.publish('indexRooms', function(){
	Meteor.publishWithRelations({
		handle: this,
		collection: Rooms,
		filter: { isPrivate: false },
		options: { sort: { userCount: -1 }, limit: 20 },
		mappings: [
			{
				reverse: true,
				key: 'room_id',
				collection: Videos,
				filter: { nowPlaying: true }
			},
			{
				reverse: true,
				key: 'currentRoom',
				collection: Meteor.users,
				options: { 
					limit: 10, 
					fields: { username: 1, screen_name: 1, avatar: 1 }
				}
			}
		]
    });
});

Meteor.publish('room', function(room_id){
	Meteor.publishWithRelations({
		handle: this,
		collection: Rooms,
		filter: room_id,
		mappings: [
			{
				reverse: true,
				key: 'room_id',
				collection: Videos,
				mappings: [
					{
						reverse: true,
						key: 'video_id',
						collection: Votes,
						filter: { user_id: this.userId }
					},
					{
						reverse: true,
						key: 'video_id',
						collection: Skips,
						filter: { user_id: this.userId }
					}
				]
			},
			{
				reverse: true,
				key: 'currentRoom',
				collection: Meteor.users
			},
			{
				reverse: true,
				key: 'room_id',
				collection: Messages
			}
		]
    });
});