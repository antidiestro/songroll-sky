Sky = {
	helpers: {
		youtube_parser: function(url) {
			var regExp = /.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/;
			var match = url.match(regExp);
			if (match&&match[1].length==11){
				return match[1];
			} else {
				return false;
			}
		}
	},
	player: {
		el: false,
		setup: function(){
			Sky.player.el = new YT.Player('player', {
				events: {
					'onReady': function(){
						youtubePlayerReady = true;
						youtubePlayerDependency.changed();
					}
				}
			});
		}
	},
	playVideo: function(doc){
		var now = Date.now();

		// Set it to nowPlaying, playback begins automatically.
		Videos.update({_id: doc._id}, { $set: { nowPlaying: true, playTime: now } });

		Meteor.setTimeout(function(){
			// 1500ms after the video should end, remove its nowPlaying status.
			Videos.update({_id: doc._id}, { $set: { nowPlaying: false }});

			// Then, check for next video in the list.
			var nextVideo = Videos.find({room_id: doc.room_id, createdAt: { $gt: doc.createdAt }}, { sort: { createdAt: -1 }, limit: 1 }).fetch();
			if ( nextVideo.length > 0 ) {
				playVideo(nextVideo[0]);
			}

		}, (parseInt(doc.duration)*1000)+1500);
	}
}