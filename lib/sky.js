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
						resizePlayer();
					}
				}
			});
		}
	},
	generateRecommendations: function(video_id){
		if ( Meteor.isServer ) {
			var video = Videos.findOne({_id: video_id, nowPlaying: true, isAnalyzed: true});

			// Clean recommendations on the room.
			Videos.remove({room_id: video.room_id, nowPlaying: false, isSongrollRecommendation: true, voteCount: 0});

			if ( video ) {
				if ( video.type == 'track' ) {
					// Generating Spotify-based recommendations

					console.log('Spotify artist ID is '+video.spotify_artist_id);

					var moreSongs = Meteor.http.get('http://developer.echonest.com/api/v4/playlist/static?api_key=ITP9G1EXT2LX09OWG&artist_id=spotify:artist:'+video.spotify_artist_id+'&format=json&results=20&type=artist-radio').data;

					var numberOfRecommendations = 3;
					var recommendationsCount = 0;

					var recommendationsArray = [];

					moreSongs.response.songs.forEach(function(item, i){
						var trackCheck = Meteor.http.get('https://api.spotify.com/v1/search?q=track:'+encodeURIComponent(item.title)+'%20artist:'+encodeURIComponent(item.artist_name)+'&type=track&limit=1').data;

						if ( recommendationsCount == numberOfRecommendations ) {
							return;
						}

						if ( parseInt(trackCheck.tracks.total) > 0 ) {
							var track = trackCheck.tracks.items[0];
							var query = encodeURIComponent(track.name+' '+track.artists[0].name);
							var youtube_search = Meteor.http.get('https://www.googleapis.com/youtube/v3/search?part=id,snippet&q='+query+'&maxResults=1&key=AIzaSyCjkQ_YauVPcAHM541qjYVtWOX7kjYFSlE');
							if ( youtube_search.data.items.length > 0 ) {
								var youtube_info = Meteor.http.get('https://www.googleapis.com/youtube/v3/videos?part=id%2Csnippet%2CcontentDetails&id='+youtube_search.data.items[0].id.videoId+'&maxResults=1&key=AIzaSyCjkQ_YauVPcAHM541qjYVtWOX7kjYFSlE')
								var video_info = youtube_info.data.items[0];
								var data = {
									room_id: video.room_id, 
									youtube_id: video_info.id, 
									title: track.name, 
									artist_name: track.artists[0].name, 
									duration: moment.duration(video_info.contentDetails.duration).asSeconds(), 
									type: 'track', 
									source: 'spotify', 
									spotify_id: track.id,
									spotify_artist_id: track.artists[0].id,
									isAnalyzed: true,
									isSongrollRecommendation: true
								};

								if ( track.album.images[1] ) {
									data.image_url = track.album.images[1].url;
								}

								recommendationsArray.push(data);
								recommendationsCount = recommendationsCount+1;
							} else {
								console.log('Video not found.');
							}
						}
					});

					// Insert all recommendations at once.
					recommendationsArray.forEach(function(item){
						Videos.insert(item);
					});

				} else if ( video.type == 'video' ) {
					console.log('YouTube ID is '+video.youtube_id);
				}
			}

			Rooms.update({_id: video.room_id}, { $set: { generatingRecommendations: false } });
		}
	},
	playVideo: function(doc){
		var now = Date.now();

		// Set it to nowPlaying, playback begins automatically.
		Videos.update({_id: doc._id}, { $set: { nowPlaying: true, playTime: now } });

		// Remove all votes associated with this video to clean up the db.
		Votes.remove({ video_id: doc._id });

		Rooms.update({_id: doc.room_id}, { $set: { generatingRecommendations: true } });

		if ( Meteor.isServer ) {
			Meteor.setTimeout(function(){ Sky.generateRecommendations(doc._id); }, 0);
			Sky.playNextWhenOver(doc._id);
		}

	},
	playNextWhenOver: function(video_id){
		var doc = Videos.findOne({_id: video_id});

		console.log('Setting up timer for when "'+doc.title+'" is over on Room ID '+doc.room_id);

		var now = Date.now();
		var playTime = doc.playTime;
		var fromNowToEndTime = ((doc.playTime+(parseInt(doc.duration)*1000))-now);

		if ( fromNowToEndTime < 0 ) {
			fromNowToEndTime = 0;
		}

		console.log('Should be over in '+fromNowToEndTime+'ms.');

		Meteor.setTimeout(function(){
			console.log('"'+doc.title+'" is no longer nowPlaying on Room ID '+doc.room_id);

			// 1500ms after the video should end, remove its nowPlaying status.
			Videos.update({_id: doc._id}, { $set: { nowPlaying: false, didPlay: true }});

			// Then, check for next video in the list.
			var nextVideo = Videos.find({room_id: doc.room_id, didPlay: false, nowPlaying: false}, { sort: { voteCount: -1 }, limit: 1 }).fetch();
			if ( nextVideo.length > 0 ) {
				Sky.playVideo(nextVideo[0]);
			}

		}, fromNowToEndTime);
	}
}