Meteor.publish('userData', function () {
    var user = Meteor.users.find({_id: this.userId});
    var votes = Votes.find({user_id: this.userId});
    var skips = Skips.find({user_id: this.userId});
    return [user, votes, skips];
});

Meteor.publish('userRooms', function(){
	return Rooms.find({user_id: this.userId});
});

Meteor.publish('userFavorites', function(){
	return Favorites.find({user_id: this.userId});
});

Meteor.publish('youtubeCache', function(idsArray){
	return Cache.YouTube.find({youtube_id: { $in: idsArray } });
});

Meteor.publish('spotifyCache', function(idsArray){
	return Cache.Spotify.find({spotify_id: { $in: idsArray } });
});

Meteor.publish('spotifyArtistCache', function(idsArray){
	return Cache.Spotify.find({spotify_artist_id: { $in: idsArray } });
})

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
					fields: { username: 1, name: 1, avatar: 1 }
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
						collection: Votes
					},
					{
						reverse: true,
						key: 'video_id',
						collection: Skips
					}
				]
			},
			{
				reverse: true,
				key: 'currentRoom',
				collection: Meteor.users,
				options: {
					fields: { username: 1, name: 1, avatar: 1 }
				}
			},
			{
				reverse: true,
				key: 'room_id',
				collection: Messages
			}
		]
    });
});