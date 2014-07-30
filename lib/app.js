contextDependency = new Deps.Dependency;

// Initialize my collections
Rooms = new Meteor.Collection("rooms");
Videos = new Meteor.Collection("videos");

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
	Videos.before.insert(function(userId, doc){
		var now = Date.now();
		doc.createdAt = now;
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