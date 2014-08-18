resizePlayer = function(){
	var player = $('#player').width();
	var height = Math.floor((player/16)*9);
	// $('#player, .player-container .col-sm-5').height(height);
}

secondsToEnd = 0;

formatDuration = function(durationInSeconds){
	var total = parseInt(durationInSeconds);
	var minutes = Math.floor(total/60);
	var seconds = total%60;

	minutes = minutes.toString();
	seconds = seconds.toString();

	if ( minutes.length == 1 ) { minutes = '0'+minutes; }
	if ( seconds.length == 1 ) { seconds = '0'+seconds; }

	return minutes+':'+seconds;
}

updateTimeRemaining = function(){
	secondsToEnd = secondsToEnd-1;

	if ( secondsToEnd < 0 ) {
		secondsToEnd = 0;
	}

	Session.set('currentVideoRemainingTime', formatDuration(secondsToEnd));

	if ( typeof Template.roomPage.currentVideoRemainingTimeTimeout !== 'undefined' ) {
		clearTimeout(Template.roomPage.currentVideoRemainingTimeTimeout);
	}

	Template.roomPage.currentVideoRemainingTimeTimeout = setTimeout(function(){ updateTimeRemaining(); }, 1000);
}

toggleScrollProposedRemainder = function(){
	if ( $('.coming-up').scrollLeft() <= 0 ) {
		$('.coming-up').find('.more-options').fadeIn('fast');
	} else {
		$('.coming-up').find('.more-options').fadeOut('fast');
	}
}

Template.roomPage.rendered = function(){
	console.log('Template has been rendered');

	youtubePlayerReady = false;
	youtubePlayerDependency.changed();

	Session.set('currentVideoRemainingTime', false);

	$('.coming-up').scroll(function(){
		toggleScrollProposedRemainder();
	});

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
				currentVideo = Videos.findOne({room_id: context._id, nowPlaying: true});
				if ( typeof Template.roomPage.currentVideoRemainingTimeTimeout !== 'undefined' ) {
					clearTimeout(Template.roomPage.currentVideoRemainingTimeTimeout);
					Session.set('currentVideoRemainingTime', false);
				}
				if ( typeof currentVideo !== 'undefined' ) {
					var videoInPlayer = ''; 
					if ( typeof Sky.player.el.getVideoData() !== 'undefined' ) {
						videoInPlayer = Sky.player.el.getVideoData().video_id;
					}
					console.log('YouTube has video '+videoInPlayer);
					Meteor.call('serverTime', function(e, checkTime){
						var startAt = checkTime-currentVideo.playTime;
						startAt = Math.floor(startAt/1000);
						secondsToEnd = parseInt(currentVideo.duration)-startAt+1;
						updateTimeRemaining();
						if ( videoInPlayer != currentVideo.youtube_id ) {
							// Sky.player.el.loadVideoById(currentVideo.youtube_id, startAt);
						}
					});
				}
			}
		});
	}
}

Template.roomPage.destroyed = function(){
	console.log('Template has been destroyed');

	if ( typeof Template.roomPage.currentVideoRemainingTimeTimeout !== 'undefined' ) {
		clearTimeout(Template.roomPage.currentVideoRemainingTimeTimeout);
		Session.set('currentVideoRemainingTime', false);
	}

	$(window).unbind('resize');

	if ( Meteor.userId() ) {
		Meteor.users.update({_id: Meteor.userId()}, { $set: { currentRoom: 0 } });
	}

	youtubePlayerReady = false;
	youtubePlayerDependency.changed();

	Sky.player.el.destroy();
	
	Template.roomPage.videoSetup.stop();

	if ( typeof Template.roomPage.videoSeeker !== 'undefined' ) {
		Template.roomPage.videoSeeker.stop();
	}
}

Template.roomPage.helpers({
	hasMoreOptions: function(){
		var proposedVideos = Videos.find({room_id: this._id, didPlay: false, nowPlaying: false}, {sort: {voteCount: -1}}).fetch();
		windowWidthDependency.depend();
		if ( windowWidth >= 1280 ) {
			if ( proposedVideos.length > 3 ) {
				return true;
				toggleScrollProposedRemainder();
			} else {
				return false;
			}
		} else {
			if ( proposedVideos.length > 2 ) {
				return true;
				toggleScrollProposedRemainder();
			} else {
				return false;
			}
		}
	},
	isGeneratingRecommendations: function(){
		var room = Rooms.findOne({_id: context._id});
		return room.generatingRecommendations;
	},
	sourceIcon: function(source){
		if ( source == 'spotify' ) {
			return 'http://www.spotify.com/favicon.ico';
		} else if ( source == 'youtube' ) {
			return 'http://www.youtube.com/favicon.ico';
		}
	},
	isSpotifyTrack: function(){
		return this.source == 'spotify';
	},
	isYouTubeVideo: function(){
		return this.source == 'youtube';
	},
	countCursor: function(cursor) {
		return cursor.length;
	},
	roomUserCount: function(){
		var room = Rooms.findOne({_id: context._id});
		return room.userCount;
	},
	messageList: function(){
		var messages = Messages.find({room_id: this._id}).fetch();
		messages.forEach(function(item, i){
			var user = Meteor.users.findOne({_id: item.user_id});
			if ( user ) {
				messages[i].user = user;
				if ( user._id == Meteor.userId() ) {
					messages[i].mine = true;
				}
			}
		});
		return messages;
	},
	userList: function(){
		return Meteor.users.find({currentRoom: this._id});
	},
	proposedVideosList: function(){
		var proposedVideos = Videos.find({room_id: this._id, didPlay: false, nowPlaying: false}, {sort: {voteCount: -1}}).fetch();
		proposedVideos.forEach(function(item, i){
			if ( item.voteCount > 0 ) {
				var voteCheck = Votes.findOne({user_id: Meteor.userId(), video_id: item._id});
				if ( voteCheck ) {
					proposedVideos[i].didVote = true;
				}
			}
		});
		return proposedVideos;
	},
	pastVideosList: function(){
		return Videos.find({room_id: this._id, didPlay: true, nowPlaying: false}, {sort: {playTime: -1}, limit: 6});
	},
	timeFormat: function(timestamp){
		return moment(timestamp).format('HH:mm');
	},
	nowPlaying: function(){
		return Videos.findOne({room_id: this._id, nowPlaying: true});
	},
	timeRemaining: function(){
		return Session.get('currentVideoRemainingTime');
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
	'click .proposed-videos-list li': function(){
		Meteor.call('toggleVote', this._id);
	},
	'click #add-video': function(){
		var room_id = this._id;
		var url = prompt('Ingresa una URL de un video de YouTube');
		if ( url ) {
			var id = Sky.helpers.youtube_parser(url);
			if ( id ) {
				Meteor.call('getVideoInfo', id, function(e, r) {
					var data = {room_id: room_id, youtube_id: r.id, title: r.snippet.title, duration: moment.duration(r.contentDetails.duration).asSeconds()};
					Videos.insert(data);
				});
			}
		}
	}
});