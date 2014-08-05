resizePlayer = function(){
	var player = $('#player').width();
	var height = Math.floor((player/16)*9);
	$('#player, .player-container .col-sm-5').height(height);
}

Template.roomPage.rendered = function(){
	console.log('Template has been rendered');

	// Resize player to keep 16:9 aspect ratio
	$(window).resize(function(){
		resizePlayer();
	});

	if ( Meteor.isClient ) {
		Template.roomPage.userCatcher = Deps.autorun(function(){
			contextDependency.depend();
			if ( Meteor.userId() && context ) {
				console.log('User is now on room '+context._id);
				Meteor.users.update({_id: Meteor.userId()}, { $set: { currentRoom: context._id } });
			}
		});
	}

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

	$(window).unbind('resize');

	if ( Meteor.userId() ) {
		Meteor.users.update({_id: Meteor.userId()}, { $set: { currentRoom: 0 } });
	}

	Sky.player.el.destroy();
	youtubePlayerReady = false;
	youtubePlayerDependency.changed();
	
	Template.roomPage.videoSetup.stop();

	if ( typeof Template.roomPage.videoSeeker !== 'undefined' ) {
		Template.roomPage.videoSeeker.stop();
	}
}

Template.roomPage.helpers({
	messageList: function(){
		var messages = Messages.find({room_id: this._id}).fetch();
		messages.forEach(function(item, i){
			var user = Meteor.users.findOne({_id: item.user_id});
			messages[i].user = user;
			if ( user._id == Meteor.userId() ) {
				messages[i].mine = true;
			}
		});
		return messages;
	},
	userList: function(){
		return Meteor.users.find({currentRoom: this._id});
	},
	proposedVideosList: function(){
		return Videos.find({room_id: this._id, didPlay: false, nowPlaying: false}, {sort: {voteCount: -1}});
	},
	timeFormat: function(timestamp){
		return moment(timestamp).format('HH:mm');
	},
	nowPlaying: function(){
		return Videos.findOne({room_id: this._id, nowPlaying: true});
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
	'submit #sendMessage': function(e){
		e.preventDefault();
		var messageInput = $(e.target).find('input[type="text"]');
		var messageText = messageInput.val();
		messageInput.val('');
		Messages.insert({user_id: Meteor.userId(), room_id: context._id, text: messageText});
	},
	'click .vote-count': function(){
		console.log(this._id);
		Meteor.call('toggleVote', this._id);
	},
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