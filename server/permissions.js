Rooms.allow({
	insert: function(userId, room){
		if ( userId ) {
			return true;
		}
	}
});

Messages.allow({
	insert: function(userId, message){
		if ( userId && message.user_id === userId ) {
			return true;
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