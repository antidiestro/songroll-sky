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
				playerVars: { 'controls': 0, 'modestbranding': 1, 'rel': 0, 'showinfo': 0, 'iv_load_policy': 3 },
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

		// Remove all votes associated with this video to clean up the db.
		Votes.remove({ video_id: doc._id });

		Meteor.setTimeout(function(){
			console.log('Video with id '+doc._id+' will stop being nowPlaying NOW.');

			// 1500ms after the video should end, remove its nowPlaying status.
			Videos.update({_id: doc._id}, { $set: { nowPlaying: false, didPlay: true }});

			// Then, check for next video in the list.
			var nextVideo = Videos.find({room_id: doc.room_id, createdAt: { $gt: doc.createdAt }}, { sort: { voteCount: -1 }, limit: 1 }).fetch();
			if ( nextVideo.length > 0 ) {
				Sky.playVideo(nextVideo[0]);
			}

		}, (parseInt(doc.duration)*1000)+1500);
	}
}