OAuth = Meteor.require('oauth');

twitter = new OAuth.OAuth(
    'https://api.twitter.com/oauth/request_token',
    'https://api.twitter.com/oauth/access_token',
    'bmtHFRpbZg5ek4uhC1v1kMsls',
    'inM3POvVn1uNeOdGhRgQbxrLa8TvmwNlLOyaQaJ8JbItul6DDX',
    '1.0A',
    null,
    'HMAC-SHA1'
);

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
});

Meteor.users.allow({
	update: function (userId, doc, fields, modifier) {
		if (userId && doc._id === userId) {
			return true;
		}
	}
});

function cleanVideoName(video_title, track, artist){
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
		var query = encodeURIComponent(track.name+' '+track.artist_name);
		var youtube_search = Meteor.http.get('https://www.googleapis.com/youtube/v3/search?part=id,snippet&q='+query+'&maxResults=1&key=AIzaSyCjkQ_YauVPcAHM541qjYVtWOX7kjYFSlE');
		if ( youtube_search.data.items.length > 0 ) {
			var youtube_info = Meteor.http.get('https://www.googleapis.com/youtube/v3/videos?part=id%2Csnippet%2CcontentDetails&id='+youtube_search.data.items[0].id.videoId+'&maxResults=1&key=AIzaSyCjkQ_YauVPcAHM541qjYVtWOX7kjYFSlE')
			var video_info = youtube_info.data.items[0];
			var data = {
				room_id: room_id, 
				youtube_id: video_info.id, 
				title: track.name, 
				artist_name: track.artist_name, 
				duration: moment.duration(video_info.contentDetails.duration).asSeconds(), 
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
		} else {
			console.log('Video not found.')
		}
	},
	insertYouTubeVideo: function(video, room_id){
		var youtube_info = Meteor.http.get('https://www.googleapis.com/youtube/v3/videos?part=id%2Csnippet%2CcontentDetails%2CtopicDetails&id='+video.id.videoId+'&maxResults=1&key=AIzaSyCjkQ_YauVPcAHM541qjYVtWOX7kjYFSlE');
		var video_info = youtube_info.data.items[0];
		var data = {
			room_id: room_id, 
			youtube_id: video_info.id, 
			title: video_info.snippet.title, 
			duration: moment.duration(video_info.contentDetails.duration).asSeconds(), 
			image_url: video_info.snippet.thumbnails.high.url, 
			type: 'video', 
			source: 'youtube',
			isAnalyzed: false
		};
		
		var thisVideo = Videos.insert(data);

		if ( video_info.topicDetails ) {
			if ( video_info.topicDetails.topicIds ) {
				video_info.topicDetails.topicIds.forEach(function(topic, i){
					var topicCheck = Meteor.http.get('https://www.googleapis.com/freebase/v1/search?query='+topic+'&filter=(all%20type:/music/recording)');
					if ( topicCheck.data.result.length > 0 ) {
						var topicInfo = Meteor.http.get('https://www.googleapis.com/freebase/v1/topic'+topic);
						var trackName = topicInfo.data.property['/type/object/name'].values[0].text;
						var artistName = topicInfo.data.property['/music/recording/artist'].values[0].text;
						
						var spotifySearch = Meteor.http.get('https://api.spotify.com/v1/search?q=track:'+encodeURIComponent(trackName)+'%20artist:'+encodeURIComponent(artistName)+'&type=track&limit=1');

						if ( spotifySearch.data.tracks.items.length > 0 )  {
							var trackInfo = spotifySearch.data.tracks.items[0];
							var cleanVideoTitle = cleanVideoName(video_info.snippet.title, trackInfo.name, trackInfo.artists[0].name);

							var dataToUpdate = {
								title: trackInfo.name, 
								artist_name: trackInfo.artists[0].name, 
								subtitle: cleanVideoTitle, 
								image_url: trackInfo.album.images[1].url, 
								type: 'track', 
								spotify_id: trackInfo.id,
								spotify_artist_id: trackInfo.artists[0].id
							}

							Videos.update({_id: thisVideo}, { $set: dataToUpdate });
						}
					}
				});
			}
		}

		Videos.update({_id: thisVideo}, { $set: { isAnalyzed: true } });

		Sky.generateRecommendations(thisVideo);
	},
	getVideoInfo: function(youtube_id){
		var request = Meteor.http.get('https://www.googleapis.com/youtube/v3/videos?part=id%2Csnippet%2CcontentDetails&id='+youtube_id+'&maxResults=1&key=AIzaSyCjkQ_YauVPcAHM541qjYVtWOX7kjYFSlE');
		return request.data.items[0];
	},
	findVideo: function(query){
		var results = Meteor.http.get('https://www.googleapis.com/youtube/v3/search?part=id,snippet&q=pulp&key=AIzaSyCjkQ_YauVPcAHM541qjYVtWOX7kjYFSlE');
		return results;
	},
	searchSpotify: function(query){
		var results = Meteor.http.get('https://api.spotify.com/v1/search?q='+encodeURIComponent(query)+'&type=track');
		return JSON.parse(results.content);
	},
	searchYouTube: function(query){
		var results = Meteor.http.get('https://www.googleapis.com/youtube/v3/search?part=id,snippet&q='+encodeURIComponent(query)+'&maxResults=10&key=AIzaSyCjkQ_YauVPcAHM541qjYVtWOX7kjYFSlE');
		return results;
	}
});

Meteor.publish('messages', function(){
	return Messages.find();
});

Meteor.publish('users', function(){
	return Meteor.users.find();
});

Meteor.publish('rooms', function(){
	return Rooms.find();
});

Meteor.publish('videos', function(){
	return Videos.find();
});

Meteor.publish('votes', function(){
	return Votes.find();
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