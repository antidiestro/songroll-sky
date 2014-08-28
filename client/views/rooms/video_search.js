Template.videoSearch.helpers({
	isSearching: function(){
		return Session.get('isSearching');
	},
	isSearchingSpotify: function(){
		return Session.get('spotifySearching');
	},
	isSearchingYouTube: function(){
		return Session.get('youtubeSearching');
	},
	spotifySearchResults: function(){
		var spotify_results = Session.get('spotifyResults');
		if ( spotify_results ) {
			spotify_results.forEach(function(item,i){
				spotify_results[i].artist_name = item.artists[0].name;
				spotify_results[i].album_name = item.album.name;
				if ( item.album.images[1] ) {
					spotify_results[i].thumb_url = item.album.images[2].url;
					spotify_results[i].image_url = item.album.images[1].url;
				}
			});
			return spotify_results;
		}
	},
	youtubeSearchResults: function(){
		var youtube_results = Session.get('youtubeResults');
		if ( youtube_results ) {
			youtube_results.forEach(function(item,i){
				youtube_results[i].title = item.snippet.title;
				youtube_results[i].author_name = item.snippet.channelTitle;
				youtube_results[i].image_url = item.snippet.thumbnails.high.url;
			});
			return youtube_results;
		}
	}
})

Template.videoSearch.events({
	'change input[name="searchProvider"]': function(e){
		if ( $(e.target).val() == 'spotify' ) {
			$('#videoSearch').find('input[name="query"]').attr('placeholder', 'Search for a song, artist or both...');
		} else if ( $(e.target).val() == 'youtube' ) {
			$('#videoSearch').find('input[name="query"]').attr('placeholder', 'Search for a video or paste a YouTube link...');
		}

		if ( $.trim($('#form-search-video').find('input[name="query"]').val()) != "" ) {
			$('#form-search-video').submit();
		}
	},
	'show.bs.modal #videoSearch': function(){
		// Session.set('spotifyResults', []);
	},
	'shown.bs.modal #videoSearch': function(){		
		$('#videoSearch .tab-pane.active .search-container input').focus().select();
	},
	'click #videoSearch .search-results-spotify li': function(){
		var currentRoom = Router.current().data();
		Meteor.call('insertSpotifySong', this, currentRoom._id);
		$('#videoSearch').modal('hide');
	},
	'click #videoSearch .search-results-youtube li': function(){
		var currentRoom = Router.current().data();
		Meteor.call('insertYouTubeVideo', this, currentRoom._id);
		$('#videoSearch').modal('hide');
	},
	'submit #form-search-video': function(e){
		e.preventDefault();
		var query = $('#form-search-video input[name="query"]').val();
		var provider = $('#form-search-video input[name="searchProvider"]:checked').val();

		Session.set('youtubeResults', false);
		Session.set('spotifyResults', false);

		Session.set('isSearching', true);

		if ( provider == 'spotify' ) {
			Meteor.call('searchSpotify', query, function(e, r){
				Session.set('isSearching', false);
				Session.set('spotifyResults', r.tracks.items);
			});
		} else if ( provider == 'youtube' ) {
			Meteor.call('searchYouTube', query, function(e, r){
				Session.set('isSearching', false);
				Session.set('youtubeResults', r.items);
			});
		}
	},
	'submit #form-search-spotify': function(e){
		e.preventDefault();
		var query = $('#form-search-spotify input').val();
		Session.set('spotifySearching', true);
		Meteor.call('searchSpotify', query, function(e, r){
			Session.set('spotifySearching', false);
			Session.set('spotifyResults', r.tracks.items);
		});
	},
	'submit #form-search-youtube': function(e){
		e.preventDefault();
		var query = $('#form-search-youtube input').val();
		Session.set('youtubeSearching', true);
		Meteor.call('searchYouTube', query, function(e, r){
			Session.set('youtubeSearching', false);
			Session.set('youtubeResults', r.items);
		});
	}
})