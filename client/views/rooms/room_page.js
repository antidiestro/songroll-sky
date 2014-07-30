Template.roomPage.rendered = function(){
	console.log('Template has been rendered');

	Template.roomPage.videoSetup = Deps.autorun(function(){
		youtubeApiDependency.depend();
		if ( youtubeApiReady == true ) {
			Sky.player.setup();
		}
	});

	if ( typeof Template.roomPage.videoSeeker === 'undefined' || Template.roomPage.videoSeeker.stopped == true ) {
		Template.roomPage.videoSeeker = Deps.autorun(function(){
			contextDependency.depend();
			youtubePlayerDependency.depend();
			if ( typeof context !== 'undefined' && youtubePlayerReady == true ) {
				var checkTime = Date.now();
				var currentVideo = Videos.findOne({room_id: context._id, nowPlaying: true});
				if ( typeof currentVideo !== 'undefined' ) {
					var startAt = checkTime-currentVideo.playTime;
					startAt = Math.floor(startAt/1000);
					
					Sky.player.el.loadVideoById(currentVideo.youtube_id, startAt);
				} else {
					console.log('No video should be playing.');
				}
			}
		});
	}
}

Template.roomPage.destroyed = function(){
	console.log('Template has been destroyed');

	Sky.player.el.destroy();
	youtubePlayerReady = false;
	youtubePlayerDependency.changed();
	
	Template.roomPage.videoSetup.stop();

	if ( typeof Template.roomPage.videoSeeker !== 'undefined' ) {
		Template.roomPage.videoSeeker.stop();
	}
}

Template.roomPage.helpers({
	videoList: function(){
		return Videos.find({room_id: this._id}, {sort: {playTime: -1}});
	},
	timeFormat: function(timestamp){
		return moment(timestamp).format('HH:mm');
	},
	isPlaying: function(nowPlaying){
		if ( nowPlaying == true ) {
			return 'now-playing';
		}
	}
});

Template.roomPage.helpers({
	videoList: function(){
		return Videos.find({room_id: this._id});
	},
	timeFormat: function(timestamp){
		return moment(timestamp).format('HH:mm');
	}
});

Template.roomPage.events({
	'click #add-video': function(){
		var room_id = this._id;
		var url = prompt('Ingresa una URL de un video de YouTube');
		if ( url ) {
			var id = Sky.helpers.youtube_parser(url);
			if ( id ) {
				console.log('Cargando video con id '+id);
				Meteor.call('getVideoInfo', id, function(e, r) {
					var data = {room_id: room_id, youtube_id: r.id, title: r.snippet.title, duration: moment.duration(r.contentDetails.duration).asSeconds()};
					Videos.insert(data);
				});
			}
		}
	}
});