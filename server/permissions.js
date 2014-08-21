Rooms.allow({
	insert: function(userId, room){
		if ( userId ) {
			return true;
		}
	}
});

Messages.allow({
	insert: function(userId, message){
		if ( userId && message.user_id === userId && message.text.trim().length > 0 ) {
			return true;
		}
	}
});

Favorites.allow({
	insert: function (userId, favorite){
		var favoriteCheck;
		if ( favorite.spotify_id ) {
			favoriteCheck = Favorites.findOne({user_id: userId, youtube_id: favorite.youtube_id, spotify_id: favorite.spotify_id});
		} else {
			favoriteCheck = Favorites.findOne({user_id: userId, youtube_id: favorite.youtube_id});
		}

		if ( favoriteCheck ) {
			return false;
		} else {
			if ( userId && favorite.user_id === userId ) {
				return true;
			} else {
				return false;
			}
		}
	},
	remove: function(userId, vote){
		if ( userId && vote.user_id === userId ) {
			return true;
		} else {
			return false;
		}
	}
});

Skips.allow({
	insert: function (userId, vote){
		var voteCheck = Skips.findOne({user_id: userId, video_id: vote.video_id});
		if ( voteCheck ) {
			return false;
		} else {
			if ( userId && vote.user_id === userId ) {
				return true;
			} else {
				return false;
			}
		}
	},
	remove: function(userId, vote){
		if ( userId && vote.user_id === userId ) {
			return true;
		} else {
			return false;
		}
	}
});

Votes.allow({
	insert: function (userId, vote){
		var voteCheck = Votes.findOne({user_id: userId, video_id: vote.video_id});
		if ( voteCheck ) {
			return false;
		} else {
			if ( userId && vote.user_id === userId ) {
				return true;
			} else {
				return false;
			}
		}
	},
	remove: function(userId, vote){
		if ( userId && vote.user_id === userId ) {
			return true;
		} else {
			return false;
		}
	}
});

Meteor.users.allow({
	update: function (userId, doc, fields, modifier) {
		if (userId && doc._id === userId) {
			return true;
		}
	}
});