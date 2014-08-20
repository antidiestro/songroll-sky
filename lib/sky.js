Sky = {
	log: function(ns, message){
		console.log('['+ns+'] '+message);
	},
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

			if ( video ) {
				var roomData = Rooms.findOne({_id: video.room_id});

				if ( roomData.userCount == 0 ) {
					// No users in this room, do not generate recommendations.
					return;
				}

				Videos.remove({room_id: video.room_id, nowPlaying: false, didPlay: false, isSongrollRecommendation: true, voteCount: 0});

				if ( video.type == 'track' ) {
					// Generating Spotify-based recommendations

					console.log('Spotify artist ID is '+video.spotify_artist_id);

					var moreSongs = Sky.api.theEchoNest.similarTracks(video.spotify_id, video.spotify_artist_id);

					var numberOfRecommendations = 4;
					var recommendationsCount = 0;

					var recommendationsArray = [];

					moreSongs.forEach(function(item, i){
						if ( recommendationsCount == numberOfRecommendations ) {
							return;
						} else {
							var track;
							var echonestCacheCheck = Cache.Echonest.findOne({echonest_id: item.id});

							if ( echonestCacheCheck ) {
								var trackCheck = Cache.Spotify.findOne({spotify_id: echonestCacheCheck.spotify_id});
								if ( trackCheck ) {
									track = trackCheck.cacheData;
								}
							} else {
								var trackSearch = Sky.api.spotify.findWithArtist(item.title, item.artist_name);
								if ( trackSearch.tracks.items.length > 0 ) {
									track = trackSearch.tracks.items[0];

									var spotifyCacheCheck = Cache.Spotify.findOne({spotify_id: track.id});
									if ( !spotifyCacheCheck ) {
										Cache.Spotify.insert({spotify_id: track.id, cacheData: track});
									}

									Cache.Echonest.insert({echonest_id: item.id, spotify_id: track.id});
								}
							}

							if ( typeof track !== 'undefined' ) {
								var videoInfo;
								var cacheCheck = Cache.Spotify.findOne({spotify_id: track.id});
								if ( cacheCheck && cacheCheck.youtube_id ) {
									videoInfo = Sky.api.youTube.videoInfo(cacheCheck.youtube_id);
								} else {
									var query = track.name+' '+track.artists[0].name;
									var youtubeSearch = Sky.api.youTube.search(query, 1);
									if ( youtubeSearch.items.length > 0 ) {
										videoInfo = Sky.api.youTube.videoInfo(youtubeSearch.items[0].id.videoId);
										if ( cacheCheck ) {
											Cache.Spotify.update({_id: cacheCheck._id}, { $set: { youtube_id: youtubeSearch.items[0].id.videoId } });
										}
									} else {
										console.log('Video not found.');
										return;
									}
								}
							
								if ( typeof videoInfo !== 'undefined' ) {
									var data = {
										room_id: video.room_id, 
										youtube_id: videoInfo.id, 
										title: track.name, 
										artist_name: track.artists[0].name, 
										duration: moment.duration(videoInfo.contentDetails.duration).asSeconds(), 
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

									var checkPreviousSpotify = Videos.find({room_id: video.room_id, spotify_id: track.id}).count();
									var checkPreviousYouTube = Videos.find({room_id: video.room_id, youtube_id: videoInfo.id}).count();

									if ( checkPreviousSpotify > 0 || checkPreviousYouTube > 0 ) {
										console.log('Skipping, dupe found.');
									} else {
										recommendationsArray.push(data);
										recommendationsCount = recommendationsCount+1;
									}

								}
							}
						}
					});

					// Insert all recommendations at once.
					recommendationsArray.forEach(function(item){
						Videos.insert(item);
					});

				} else if ( video.type == 'video' ) {
					var moreVideos = Sky.api.youTube.similarVideos(video.youtube_id);

					var numberOfRecommendations = 4;
					var recommendationsCount = 0;

					var recommendationsArray = [];

					var randomVideos = shuffleArray(moreVideos.items);

					randomVideos.forEach(function(item, i){
						if ( recommendationsCount == numberOfRecommendations ) {
							return;
						} else {
							console.log('Try '+item.id.videoId);

							var videoInfo = Sky.api.youTube.videoInfo(item.id.videoId);

							recommendationsCount = recommendationsCount+1;

							var data = {
								room_id: video.room_id, 
								youtube_id: videoInfo.id, 
								title: videoInfo.snippet.title, 
								duration: moment.duration(videoInfo.contentDetails.duration).asSeconds(), 
								image_url: videoInfo.snippet.thumbnails.high.url, 
								type: 'video', 
								source: 'youtube',
								isAnalyzed: false,
								isSongrollRecommendation: true,
								youtube_info: videoInfo
							};

							recommendationsArray.push(data);
						}						
					});

					recommendationsArray.forEach(function(item,i){
						Videos.insert(item);
					})
				}

				Rooms.update({_id: video.room_id}, { $set: { generatingRecommendations: false } });
			}
		}
	},
	playVideo: function(doc){
		var now = Date.now();

		// Set it to nowPlaying, playback begins automatically.
		Videos.update({_id: doc._id}, { $set: { nowPlaying: true, playTime: now } });

		// Remove all votes associated with this video to clean up the db.
		Votes.remove({ video_id: doc._id });

		var room = Rooms.findOne({_id: doc.room_id});

		if ( room.hasRecommendations ) {
			Rooms.update({_id: doc.room_id}, { $set: { generatingRecommendations: true } });

			if ( Meteor.isServer ) {
				Meteor.setTimeout(function(){ Sky.generateRecommendations(doc._id); }, 0);
				Sky.playNextWhenOver(doc._id);
			}
		}
	},
	playNextWhenOver: function(video_id){
		var doc = Videos.findOne({_id: video_id});

		var now = Date.now();
		var playTime = doc.playTime;
		var fromNowToEndTime = ((doc.playTime+(parseInt(doc.duration)*1000))-now)+1500;

		if ( fromNowToEndTime < 0 ) {
			fromNowToEndTime = 0;
		}

		Timeouts[doc._id] = Meteor.setTimeout(function(){
			Sky.playNext(doc._id);
		}, fromNowToEndTime);
	},
	playNext: function(video_id){
		var doc = Videos.findOne({_id: video_id});
		if ( doc ) {
			console.log('Clearing timeout for '+doc.title);
			Meteor.clearTimeout(Timeouts[doc._id]);
			Videos.update({_id: doc._id}, { $set: { nowPlaying: false, didPlay: true }});
			var nextVideo = Videos.find({room_id: doc.room_id, didPlay: false, nowPlaying: false}, { sort: { voteCount: -1 }, limit: 1 }).fetch();
			if ( nextVideo.length > 0 ) {
				Sky.playVideo(nextVideo[0]);
			}
		}
	}
}