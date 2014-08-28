Handlebars.registerHelper('equalsTo', function(a, b){
	return a == b;
});

Meteor.startup(function(){
	console.log('Hey server! This is Songroll Sky.');
	console.log('To kick things off, I will look for songs currently playing and set timers for when they end.');
	var nowPlaying = Videos.find({nowPlaying: true});
	nowPlaying.forEach(function(doc, i){
		Sky.playNextWhenOver(doc._id);
	});

	// Insert welcome room
	if ( !Rooms.findOne({title: 'Welcome to Songroll', featured: true}) ) {
		Rooms.insert({title: 'Welcome to Songroll', featured: true, description: 'Learn the basics while you listen to awesome music and chat with cool people.', hasRecommendations: true, isPrivate: false});
	}
});

cleanVideoName = function(video_title, track, artist){
	var finalVideoTitle = video_title;

	var trackName = track;
	var artistName = artist;

	// Always remove these characters from track name, artist name and final video title.
	var removeChars = ["-", "—", "~", "|", "(", ")", "[", "]", "'", "¿", "?", "!", "¡", ",", '"', "feat.", "feat", "ft.", "ft"];

	// Always remove these strings from the video title (case insensitive).
	var removeStrings = ["official video", "official audio", "lyrics video", "cover art", "video oficial", "original mix", "feat.", "feat", "ft.", "ft"];

	// Remove these strings, only if they are not part of the artist's or track's name.
	var removeIfMissing = ["lyrics", "audio", "official", "video", "oficial", "music", "hd"];

	// Build RegExp objects to check against video title.
	var removeRegex = [];

	var trackNameSplit = trackName.split('-');
	if ( trackNameSplit.length == 1 ) {
		trackNameSplit = trackName.split('—');  // caution, this is an "em dash"
	}

	trackNameSplit.forEach(function(trackNamePart){
		var trackNamePartFiltered = trackNamePart;
		removeChars.forEach(function(char){
			trackNamePartFiltered = trackNamePartFiltered.replace(char, '');
		});
		console.log(trackNamePartFiltered.trim());
		var regex = new RegExp(trackNamePartFiltered.trim(), 'gi');
		removeRegex.push(regex);
	});

	// Remove characters from artist name for later comparison.
	removeChars.forEach(function(char){
		artistName = artistName.replace(char, '');
	});

	var artistNameRegex = new RegExp(artistName, 'gi');
	removeRegex.push(artistNameRegex);

	// Remove characters from final video title
	removeChars.forEach(function(char){
		while ( finalVideoTitle.toLowerCase().indexOf(char) != -1 ) {
			finalVideoTitle = finalVideoTitle.replace(char, ' ');
		}
	});

	// Remove strings from video title
	removeStrings.forEach(function(string){
		var stringRegex = new RegExp(string, 'gi');
		finalVideoTitle = finalVideoTitle.replace(stringRegex, ' ');
	});

	// Remove strings if missing from video title
	removeIfMissing.forEach(function(string){
		if ( trackName.toLowerCase().indexOf(string) == -1 && artistName.toLowerCase().indexOf(string) == -1 ) {
			var stringRegex = new RegExp(string, 'gi');
			finalVideoTitle = finalVideoTitle.replace(stringRegex, ' ');
		}
	});

	removeRegex.forEach(function(regex){
		finalVideoTitle = finalVideoTitle.replace(regex, ' ');
	});

	finalVideoTitle = finalVideoTitle.replace(/\s+/g, " ");
	finalVideoTitle = finalVideoTitle.trim();

	console.log(finalVideoTitle);

	return finalVideoTitle;
}

Meteor.methods({
	serverTime: function(){
		return Date.now();
	},
	toggleVote: function(video_id){
		var vote_check = Votes.findOne({user_id: Meteor.userId(), video_id: video_id});
		if ( vote_check ) {
			Votes.remove({user_id: Meteor.userId(), video_id: video_id});
		} else {
			Votes.insert({user_id: Meteor.userId(), video_id: video_id});
		}
	},
	insertSpotifySong: function(track, room_id){
		var videoInfo;
		var cacheCheck = Cache.Spotify.findOne({spotify_id: track.id});

		if ( cacheCheck && cacheCheck.youtube_id ) {
			videoInfo = Sky.api.youTube.videoInfo(cacheCheck.youtube_id);
		} else {
			var query = track.name+' '+track.artist_name;
			var youtubeSearch = Sky.api.youTube.search(query, 1);
			if ( youtubeSearch.items.length > 0 ) {
				videoInfo = Sky.api.youTube.videoInfo(youtubeSearch.items[0].id.videoId);
				if ( cacheCheck ) {
					Cache.Spotify.update({_id: cacheCheck._id}, { $set: { youtube_id: youtubeSearch.items[0].id.videoId } });
				} else {
					Cache.Spotify.insert({spotify_id: track.id, youtube_id: youtubeSearch.items[0].id.videoId, cacheData: track});
				}
			} else {
				console.log('Video not found.');
				return;
			}
		}

		var data = {
			room_id: room_id, 
			youtube_id: videoInfo.id, 
			title: track.name, 
			artist_name: track.artist_name, 
			duration: moment.duration(videoInfo.contentDetails.duration).asSeconds(), 
			type: 'track', 
			source: 'spotify', 
			spotify_id: track.id,
			spotify_artist_id: track.artists[0].id,
			isAnalyzed: true
		};

		if ( track.image_url ) {
			data.image_url = track.image_url;
		}
		
		var thisVideo = Videos.insert(data);
		if ( Meteor.userId() ) {
			Votes.insert({user_id: Meteor.userId(), video_id: thisVideo});
		}
	},
	insertYouTubeVideo: function(video, room_id){
		var videoInfo = Sky.api.youTube.videoInfo(video.id.videoId);
		var data = {
			room_id: room_id, 
			youtube_id: videoInfo.id, 
			title: videoInfo.snippet.title, 
			duration: moment.duration(videoInfo.contentDetails.duration).asSeconds(), 
			image_url: videoInfo.snippet.thumbnails.high.url, 
			type: 'video', 
			source: 'youtube',
			isAnalyzed: false,
			youtube_info: videoInfo
		};

		var thisVideo = Videos.insert(data);
		if ( Meteor.userId() ) {
			Votes.insert({user_id: Meteor.userId(), video_id: thisVideo});
		}
	},
	searchSpotify: function(query){
		return Sky.api.spotify.search(query);
	},
	searchYouTube: function(query){
		return Sky.api.youTube.search(query);
	}
});

Accounts.onCreateUser(function(options, user){
	if ( user.services.twitter ) {
		user.name = user.services.twitter.screenName;
		user.username = user.services.twitter.screenName;
		user.avatar = user.services.twitter.profile_image_url_https;
	}
	return user;
});

Accounts.onLogin(function(e) {
	var user = e.user;
	var url = "https://api.twitter.com/1.1/users/show.json?screen_name="+user.username;
	twitter.get(url, user.services.twitter.accessToken, user.services.twitter.accessTokenSecret, Meteor.bindEnvironment(function(err, d, r){
		if ( !err ) {
			var account = Meteor.users.findOne({_id: user._id});
			if ( account ) {
				var twitter_data = JSON.parse(d);
				Meteor.users.update({_id: account._id}, { $set: { name: twitter_data.name, username: twitter_data.screen_name, avatar: twitter_data.profile_image_url_https } });
			}
		}
	}));

});


// Kick users on exit
UserStatus.events.on("connectionLogout", function(fields) {
	var userCheck = Meteor.users.findOne({_id: fields.userId, 'status.online': true});
	if ( !userCheck ) {
		Meteor.users.update({_id: fields.userId}, { $set: { currentRoom: 0 } })
	}
});


// Collection handlers

Meteor.users.after.update(function(userId, doc, fieldNames, modifier){
	if ( modifier.$set ) {
		if ( typeof modifier.$set.currentRoom !== 'undefined' ) {
			if ( this.previous.currentRoom != modifier.$set.currentRoom ) {
				var pastRoom = Rooms.findOne({_id: this.previous.currentRoom});
				var nextRoom = Rooms.findOne({_id: modifier.$set.currentRoom});

				if ( pastRoom ) {
					var pastRoomCount = Meteor.users.find({currentRoom: pastRoom._id}).count();
					Rooms.update({_id: pastRoom._id}, { $set: { userCount: pastRoomCount } });
					Messages.insert({user_id: doc._id, room_id: pastRoom._id, isActivityMessage: true, activityType: 'leave'});
				}

				if ( nextRoom ) {
					Meteor.users.update({'status.online': false, currentRoom: nextRoom._id}, {$set: {currentRoom: 0}});
					var nextRoomCount = Meteor.users.find({currentRoom: nextRoom._id}).count();
					Rooms.update({_id: nextRoom._id}, { $set: { userCount: nextRoomCount } });
					Messages.insert({user_id: doc._id, room_id: nextRoom._id, isActivityMessage: true, activityType: 'join'});
				}
			}
		}
	}
});

Votes.after.insert(function(userId, doc){
	var videoVoteCount = Votes.find({video_id: doc.video_id}).count();
	Videos.update({_id: doc.video_id}, { $set: { voteCount: videoVoteCount } });
});

Votes.after.remove(function(userId, doc){
	var videoVoteCount = Votes.find({video_id: doc.video_id}).count();
	Videos.update({_id: doc.video_id}, { $set: { voteCount: videoVoteCount } });
});

Skips.after.insert(function(userId, doc){
	var skipsCount = Skips.find({video_id: doc.video_id}).count();
	var video = Videos.findOne({_id: doc.video_id});
	var userCount = Meteor.users.find({currentRoom: video.room_id}).count();
	if ( skipsCount > (userCount/2) ) {
		Sky.playNext(video._id);
		Skips.remove({video_id: doc.video_id});
	}
});

Messages.before.insert(function(userId, doc){
	var now = Date.now();
	doc.createdAt = now;
});

Favorites.before.insert(function(userId, doc){
	var now = Date.now();
	doc.createdAt = now;
});

Rooms.before.insert(function(userId, doc){
	doc.user_id = userId;
	doc.generatingRecommendations = false;
	doc.userCount = 0;
});

Videos.before.insert(function(userId, doc){
	var now = Date.now();
	doc.createdAt = now;
	doc.didPlay = false;
	doc.voteCount = 0;
	doc.nowPlaying = false;
});

Videos.after.insert(function(userId, doc){

	if ( userId ) {
		Messages.insert({room_id: doc.room_id, video_id: doc._id, user_id: userId, isActivityMessage: true, activityType: 'addVideo'});		
	}

	var now = Date.now();

	// Is there another video playing right now in this room?
	var currentVideo = Videos.find({room_id: doc.room_id, nowPlaying: true}).fetch();
	if ( currentVideo.length == 0 ) {
		Sky.playVideo(doc);
	}

	if ( doc.type == 'video' && doc.source == 'youtube' ) {

		Meteor.setTimeout(function(){
			Sky.api.spotify.checkVideoForMusic(doc);
		}, 0);
	} else if ( doc.type == 'track' && doc.source == 'spotify' ) {
		Sky.api.spotify.cacheArtistData(doc.spotify_artist_id);
	}
});

