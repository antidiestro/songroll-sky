twitter = new TwitterApi();

Meteor.methods({
	getVideoInfo: function(youtube_id){
		var request = Meteor.http.get('https://www.googleapis.com/youtube/v3/videos?part=id%2Csnippet%2CcontentDetails&id='+youtube_id+'&maxResults=1&key=AIzaSyCjkQ_YauVPcAHM541qjYVtWOX7kjYFSlE');
		return request.data.items[0];
	},
	findVideo: function(query){
		var results = Meteor.http.get('https://www.googleapis.com/youtube/v3/search?part=id,snippet&q=pulp&key=AIzaSyCjkQ_YauVPcAHM541qjYVtWOX7kjYFSlE');
		return results;
	},
	getTwitterInfo: function(){
		return twitter.get('account/verify_credentials.json');
	}
});

Meteor.publish('rooms', function(){
	return Rooms.find();
});
Meteor.publish('videos', function(){
	return Videos.find();
});

Accounts.onLogin(function(e) {
	// Well hello there
	console.log('Welcome back '+e.user.profile.name);

	console.log(e.user.services.twitter);

	var user = Meteor.call('getTwitterInfo');

	console.log(user);
});