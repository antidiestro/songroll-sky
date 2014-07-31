contextDependency = new Deps.Dependency;

// Initialize my collections
Rooms = new Meteor.Collection("rooms");
Videos = new Meteor.Collection("videos");
Messages = new Meteor.Collection("messages");
Votes = new Meteor.Collection("votes");

// Dependencies for YouTube player
youtubeApiReady = false;
youtubePlayerReady = false;

youtubeApiDependency = new Deps.Dependency;
youtubePlayerDependency = new Deps.Dependency;

onYouTubeIframeAPIReady = function(){
	youtubeApiReady = true;
	youtubeApiDependency.changed();
}

// Populate Videos on insert with needed data
if ( Meteor.isServer ) {
	Votes.after.insert(function(userId, doc){
		var videoVoteCount = Votes.find({video_id: doc.video_id}).count();
		Videos.update({_id: doc.video_id}, { $set: { voteCount: videoVoteCount } });
	});

	Votes.after.remove(function(userId, doc){
		var videoVoteCount = Votes.find({video_id: doc.video_id}).count();
		Videos.update({_id: doc.video_id}, { $set: { voteCount: videoVoteCount } });
	});

	Messages.before.insert(function(userId, doc){
		var now = Date.now();
		doc.createdAt = now;
	});

	Videos.before.insert(function(userId, doc){
		var now = Date.now();
		doc.createdAt = now;
		doc.didPlay = false;
		doc.voteCount = 0;
		doc.nowPlaying = false;
	});

	Videos.after.insert(function(userId, doc){
		var now = Date.now();

		// Is there another video playing right now in this room?
		var currentVideo = Videos.find({room_id: doc.room_id, nowPlaying: true}).fetch();
		if ( currentVideo.length == 0 ) {
			Sky.playVideo(doc);
		}
	});
}