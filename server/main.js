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