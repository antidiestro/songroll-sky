contextDependency = new Deps.Dependency;

Rooms = new Meteor.Collection("rooms");
Videos = new Meteor.Collection("videos");

Videos.before.insert(function(userId, doc){
	doc.nowPlaying = false;
	var latestVideo = Videos.findOne({room_id: doc.room_id}, {sort: {endTime: -1}});
	var now = Date.now();

	// There's a video queued in the future
	if ( latestVideo && latestVideo.endTime > now ) {
		doc.playTime = latestVideo.endTime+1500;
	} else {
		doc.playTime = now;
	}

	var durationInMilliseconds = parseInt(doc.duration)*1000;
	doc.endTime = doc.playTime+durationInMilliseconds;
});

Videos.after.insert(function(userId, doc){
	var now = Date.now();

	var millisecondsUntilPlayTime = doc.playTime-now;
	if ( millisecondsUntilPlayTime < 0 ) {
		millisecondsUntilPlayTime = 0;
	}
	Meteor.setTimeout(function(){
		Videos.update({_id: doc._id}, { $set: { nowPlaying: true } });
	}, millisecondsUntilPlayTime);

	var millisecondsUntilEndTime = doc.endTime-now;
	Meteor.setTimeout(function(){
		Videos.update({_id: doc._id}, { $set: { nowPlaying: false } });
	}, millisecondsUntilEndTime);

	console.log('At '+moment(doc.playTime).format('HH:mm:ss')+', "'+doc.title+'" will become nowPlaying.');
	console.log('At '+moment(doc.endTime).format('HH:mm:ss')+', "'+doc.title+'" will stop being nowPlaying.');
});


youtubeApiReady = false;
youtubePlayerReady = false;

youtubeApiDependency = new Deps.Dependency;
youtubePlayerDependency = new Deps.Dependency;

onYouTubeIframeAPIReady = function(){
	youtubeApiReady = true;
	youtubeApiDependency.changed();
}

Player = {
	el: false,
	setup: function(){
		Player.el = new YT.Player('player', {
			events: {
				'onReady': function(){
					youtubePlayerReady = true;
					youtubePlayerDependency.changed();
				}
			}
		});
	}
}
