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

	$('.action[data-toggle="tooltip"]:not(.tooltip-active)').addClass('tooltip-active').tooltip();
	
	Session.set('videoDisabled', false);

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

	Template.roomPage.userCatcher = Deps.autorun(function(){
		contextDependency.depend();
		if ( Meteor.userId() && context ) {
			console.log('User is now on room '+context._id);
			Meteor.users.update({_id: Meteor.userId()}, { $set: { currentRoom: context._id } });
		}
	});

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
				var videoDisabled = Session.get('videoDisabled');
				if ( videoDisabled ) {
					Sky.player.el.stopVideo();
					Sky.player.el.cueVideoById('0');
				} else {
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
								Sky.player.el.loadVideoById(currentVideo.youtube_id, startAt);
							}
						});
					}
				}
			}
		});
	}
}

Template.roomPage.destroyed = function(){
	$('body').removeClass('fullscreen mouseover');

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
	isVideoDisabled: function(){
		return Session.get('videoDisabled');
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
		if ( context ) {
			var room = Rooms.findOne({_id: context._id});
			return room.userCount;
		} else {
			return 0;
		}
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
		return proposedVideos;
	},
	pastVideosList: function(){
		return Videos.find({room_id: this._id, didPlay: true, nowPlaying: false}, {sort: {playTime: -1}, limit: 6});
	},
	timeFormat: function(timestamp){
		return moment(timestamp).format('HH:mm');
	},
	nowPlaying: function(){
		var nowPlaying = Videos.findOne({room_id: this._id, nowPlaying: true});
		if ( nowPlaying ) {
			var skipCheck = Skips.findOne({video_id: nowPlaying._id, user_id: Meteor.userId()});
			if ( skipCheck ) {
				nowPlaying.isSkipping = true;
			}
		}
		return nowPlaying;
	},
	timeRemaining: function(){
		return Session.get('currentVideoRemainingTime');
	},
	isPlaying: function(nowPlaying){
		if ( nowPlaying == true ) {
			return 'now-playing';
		}
	},
	isFavorite: function(){
		if ( this.isAnalyzed ) {
			if ( this.spotify_id ) {
				var favoriteCheck = Favorites.findOne({user_id: Meteor.userId(), spotify_id: this.spotify_id, youtube_id: this.youtube_id});
				if ( favoriteCheck ) { return true; }
			} else {
				var favoriteCheck = Favorites.findOne({user_id: Meteor.userId(), youtube_id: this.youtube_id});
				if ( favoriteCheck ) { return true; }
			}
		}
	},
	roomImage: function(){
		var video = Videos.findOne({room_id: this._id, nowPlaying: true});
		var room_image = false;
		if ( video ) {
			room_image = video.image_url;
			if ( video.spotify_artist_id ) {
				var artist = Cache.Spotify.findOne({spotify_artist_id: video.spotify_artist_id});
				if ( artist && artist.cacheData.images[0] ) {
					room_image = artist.cacheData.images[0].url;
				} else {
					localCache.spotifyArtists.push(video.spotify_artist_id);
					localCacheDeps.spotifyArtists.changed();
				}
			}
		}
		return room_image;
	},
	didVote: function(){
		var voteCheck = Votes.findOne({user_id: Meteor.userId(), video_id: this._id});
		if ( voteCheck ) { return true; }
	},
	videoVoteCount: function(){
		return Votes.find({video_id: this._id}).count();
	},
	roomLink: function(){
		return location.href;
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

var fullscreenFader = function(){
	$('body').removeClass('mouseover');
}

Template.roomPage.events({
	'mousedown .coming-up .more-options.left': function(e){
		var scrollLeft = $('.proposed-videos-list').scrollLeft();
		var width = $('.proposed-videos-list').width()*0.6;
		var newScroll;
		newScroll = scrollLeft - width;
		if ( newScroll < 0 ) { newScroll = 0; }
		$('.proposed-videos-list').animate({scrollLeft: newScroll});
	},
	'mousedown .coming-up .more-options.right': function(e){
		var scrollLeft = $('.proposed-videos-list').scrollLeft();
		var width = $('.proposed-videos-list').width()*0.6;
		var newScroll;
		newScroll = scrollLeft + width;
		$('.proposed-videos-list').animate({scrollLeft: newScroll});
	},
	'show.bs.modal #videoSearch': function(e){
		if ( !Meteor.userId() ) {
			e.preventDefault();
			$('#loginModal').modal('show');
			return;
		}
	},
	'mousemove #room-videos': function(){
		if ( $('body').is('.fullscreen') ) {
			$('body').addClass('mouseover');
			clearTimeout(Template.roomPage.fullscreenFader);
			Template.roomPage.fullscreenFader = setTimeout(fullscreenFader, 3500);
		}
	},
	'click .action-fullscreen': function(){
		if ( screenfull.enabled ) {
			if ( !$('body').is('.fullscreen') ) {
				screenfull.request();
				Template.roomPage.fullscreenFader = setTimeout(fullscreenFader, 3500);
				$('body').addClass('fullscreen mouseover');
			} else {
				screenfull.exit();
				clearTimeout(Template.roomPage.fullscreenFader);
				$('body').removeClass('fullscreen mouseover');
			}
		} else {
			alert('Your browser does not support fullscreen. Get back to the future!');
		}
	},
	'click .action-toggle': function(){
		var videoDisabled = Session.get('videoDisabled');
		if ( !videoDisabled ) {
			Session.set('videoDisabled', true);
		} else {
			Session.set('videoDisabled', false);
		}
	},
	'click .share-room': function(){
		$('.share-room').find('input').select();
	},
	'submit #sendMessage': function(e){
		if ( !Meteor.userId() ) {
			e.preventDefault();
			$('#loginModal').modal('show');
			return;
		}

		e.preventDefault();
		var messageInput = $(e.target).find('input[type="text"]');
		var messageText = messageInput.val();
		if ( $.trim(messageText) != "" ) {
			messageInput.val('');
			Messages.insert({user_id: Meteor.userId(), room_id: context._id, text: messageText});
		}
	},
	'focus #sendMessage input[type="text"]': function(e){
		if ( !Meteor.userId() ) {
			e.preventDefault();
			$('#loginModal').modal('show');
			return;
		}
	},
	'keydown #sendMessage input[type="text"]': function(e){
		if ( e.keyCode == 13 ) {
			$('#sendMessage button[type="submit"]').addClass('active');
		}
	},
	'keyup #sendMessage input[type="text"]': function(){
		$('#sendMessage button[type="submit"]').removeClass('active');
	},
	'click .proposed-videos-list li': function(){
		if ( !Meteor.userId() ) {
			$('#loginModal').modal('show');
			return;
		}
		
		var voteCheck = Votes.findOne({user_id: Meteor.userId(), video_id: this._id});

		if ( voteCheck ) {
			Votes.remove({_id: voteCheck._id});
		} else {
			Votes.insert({user_id: Meteor.userId(), video_id: this._id});
		}
	},
	'click .action-skip': function(){
		if ( !Meteor.userId() ) {
			$('#loginModal').modal('show');
			return;
		}

		var skipCheck = Skips.findOne({user_id: Meteor.userId(), video_id: this._id});

		if ( skipCheck ) {
			Skips.remove({_id: skipCheck._id});
		} else {
			Skips.insert({user_id: Meteor.userId(), video_id: this._id});
		}
	},
	'click .action-favorite': function(){
		if ( !Meteor.userId() ) {
			$('#loginModal').modal('show');
			return;
		}

		console.log('User wants to favorite video ID '+this._id);

		var now = Date.now();

		if ( this.spotify_id ) {
			var favoriteCheck = Favorites.findOne({user_id: Meteor.userId(), spotify_id: this.spotify_id, youtube_id: this.youtube_id});
			if ( favoriteCheck ) {
				Favorites.remove({_id: favoriteCheck._id});
			} else {
				Favorites.insert({user_id: Meteor.userId(), spotify_id: this.spotify_id, youtube_id: this.youtube_id, createdAt: now});
			}
		} else {
			var favoriteCheck = Favorites.findOne({user_id: Meteor.userId(), youtube_id: this.youtube_id});
			if ( favoriteCheck ) {
				Favorites.remove({_id: favoriteCheck._id});
			} else {
				Favorites.insert({user_id: Meteor.userId(), youtube_id: this.youtube_id, createdAt: now});
			}
		}
	}
});

Template.roomsPageButtons.helpers({
	isRoomFavorite: function(){
		var favoriteCheck = Favorites.findOne({user_id: Meteor.userId(), room_id: this._id});
		if ( favoriteCheck ) {
			return true;
		}
	}
});

Template.roomsPageButtons.events({
	'click #bookmark-room': function(){
		console.log('User wants to favorite room ID '+this._id);
		var now = Date.now();
		var favoriteCheck = Favorites.findOne({user_id: Meteor.userId(), room_id: this._id});
		if ( favoriteCheck ) {
			Favorites.remove({_id: favoriteCheck._id});
		} else {
			Favorites.insert({user_id: Meteor.userId(), room_id: this._id, createdAt: now});
		}
	}
})