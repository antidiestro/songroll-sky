Template.videoSearch.helpers({
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
					spotify_results[i].thumb_url = item.album.images[0].url;
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
				console.log(youtube_results);
				youtube_results[i].title = item.snippet.title;
				youtube_results[i].author_name = item.snippet.channelTitle;
				youtube_results[i].image_url = item.snippet.thumbnails.high.url;
			});
			return youtube_results;
		}
	}
})

Template.videoSearch.events({
	'show.bs.modal #videoSearch': function(){
		// Session.set('spotifyResults', []);
	},
	'shown.bs.modal #videoSearch': function(){		
		$('#videoSearch .tab-pane.active .search-container input').focus().select();
	},
	'click #videoSearch .search-results-spotify li': function(){
		Meteor.call('insertSpotifySong', this, context._id);
		$('#videoSearch').modal('hide');
	},
	'click #videoSearch .search-results-youtube li': function(){
		Meteor.call('insertYouTubeVideo', this, context._id);
		$('#videoSearch').modal('hide');
	},
	'submit #form-search-spotify': function(e){
		e.preventDefault();
		var query = $('#form-search-spotify input').val();
		Session.set('spotifySearching', true);
		Meteor.call('searchSpotify', query, function(e, r){
			Session.set('spotifySearching', false);
			Session.set('spotifyResults', r.tracks.items);
			console.log(r);
		});
	},
	'submit #form-search-youtube': function(e){
		e.preventDefault();
		var query = $('#form-search-youtube input').val();
		console.log(query);
		Session.set('youtubeSearching', true);
		Meteor.call('searchYouTube', query, function(e, r){
			Session.set('youtubeSearching', false);
			Session.set('youtubeResults', r.data.items);
			console.log(r);
		});
	}
})