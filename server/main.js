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
			console.log('User switch allowed');
			return true;
		}
	}
});

Meteor.methods({
	getVideoInfo: function(youtube_id){
		var request = Meteor.http.get('https://www.googleapis.com/youtube/v3/videos?part=id%2Csnippet%2CcontentDetails&id='+youtube_id+'&maxResults=1&key=AIzaSyCjkQ_YauVPcAHM541qjYVtWOX7kjYFSlE');
		return request.data.items[0];
	},
	findVideo: function(query){
		var results = Meteor.http.get('https://www.googleapis.com/youtube/v3/search?part=id,snippet&q=pulp&key=AIzaSyCjkQ_YauVPcAHM541qjYVtWOX7kjYFSlE');
		return results;
	}
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

Accounts.onCreateUser(function(options, user){
	if ( user.services.twitter ) {
		user.name = user.services.twitter.screenName;
		user.username = user.services.twitter.screenName;
		user.avatar = user.services.twitter.profile_image_url_https;
		// var url = "https://api.twitter.com/1.1/users/show.json?screen_name="+user.username;
		// twitter.get(url, user.services.twitter.accessToken, user.services.twitter.accessTokenSecret, Meteor.bindEnvironment(function(e, d, r){
		// 	if ( !e ) {
		// 		var account = Meteor.users.findOne({_id: user._id});
		// 		console.log(account);
		// 		var twitter_data = JSON.parse(d);
		// 	}
		// }));
	}
	return user;
});

// Accounts.onLogin(function(e) {

// });