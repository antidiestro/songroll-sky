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

Meteor.users.allow({
	update: function (userId, doc, fields, modifier) {
		if (userId && doc._id === userId) {
			return true;
		}
	}
});

Meteor.methods({
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
			var data = {room_id: room_id, youtube_id: video_info.id, title: track.name, artist_name: track.artist_name, duration: moment.duration(video_info.contentDetails.duration).asSeconds()};
			if ( track.image_url ) {
				data.image_url = track.image_url;
			}
 			Videos.insert(data);
		} else {
			console.log('Video not found.')
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
				Meteor.users.update({_id: account._id}, { $set: { name: twitter_data.name, username: twitter_data.screen_name } });
			}
		}
	}));

});