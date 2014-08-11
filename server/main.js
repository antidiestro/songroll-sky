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
	var final_title = video_title;
	var track_name = track;
	var artist_name = artist;

	var remove = ["official video", "original mix", "-", "~", "|", "(", ")", "[", "]", "'", "¿", "?", "!", "¡"];

	remove.forEach(function(char){
		track_name = track_name.replace(char, '');
		artist_name = artist_name.replace(char, '');
	});

	var track_regex = new RegExp(track_name, 'gi');
	var artist_regex = new RegExp(artist_name, 'gi');

	remove.forEach(function(char){
		final_title = final_title.replace(char, '');
	});

	final_title = final_title.replace(track_regex, '');
	final_title = final_title.replace(artist_regex, '');

	final_title = final_title.trim();

	return final_title;
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
			var data = {room_id: room_id, youtube_id: video_info.id, title: track.name, artist_name: track.artist_name, duration: moment.duration(video_info.contentDetails.duration).asSeconds(), type: 'track', source: 'spotify'};
			if ( track.image_url ) {
				data.image_url = track.image_url;
			}
 			Videos.insert(data);
		} else {
			console.log('Video not found.')
		}
	},
	insertYouTubeVideo: function(video, room_id){
		var youtube_info = Meteor.http.get('https://www.googleapis.com/youtube/v3/videos?part=id%2Csnippet%2CcontentDetails%2CtopicDetails&id='+video.id.videoId+'&maxResults=1&key=AIzaSyCjkQ_YauVPcAHM541qjYVtWOX7kjYFSlE');
		var video_info = youtube_info.data.items[0];
		var data = {room_id: room_id, youtube_id: video_info.id, title: video_info.snippet.title, duration: moment.duration(video_info.contentDetails.duration).asSeconds(), image_url: video_info.snippet.thumbnails.high.url, type: 'video', source: 'youtube'};
		
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
							console.log(trackInfo);
							Videos.update({_id: thisVideo}, { $set: { title: trackInfo.name, artist_name: trackInfo.artists[0].name, subtitle: cleanVideoTitle, image_url: trackInfo.album.images[1].url, type: 'track' } });
						}
					}
				});
			}
		} 
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