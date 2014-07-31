Template.spotifySearch.helpers({
	isSearchingSpotify: function(){
		return Session.get('spotifySearching');
	},
	searchResults: function(){
		var spotify_results = Session.get('spotifyResults');
		if ( spotify_results ) {
			spotify_results.forEach(function(item,i){
				spotify_results[i].artist_name = item.artists[0].name;
				spotify_results[i].album_name = item.album.name;
				if ( item.album.images[1] ) {
					spotify_results[i].image_url = item.album.images[1].url;
				}
			});
			return spotify_results;
		}
	}
})

Template.spotifySearch.events({
	'show.bs.modal #spotifySearch': function(){
		// Session.set('spotifyResults', []);
	},
	'shown.bs.modal #spotifySearch': function(){
		$('#spotifySearch .search-container input').focus();
	},
	'click #spotifySearch .search-results li': function(){
		Meteor.call('insertSpotifySong', this, context._id);
		$('#spotifySearch').modal('hide');
	},
	'submit form.search-container': function(e){
		e.preventDefault();
		var query = $('form.search-container input').val();
		Session.set('spotifySearching', true);
		Meteor.call('searchSpotify', query, function(e, r){
			Session.set('spotifySearching', false);
			Session.set('spotifyResults', r.tracks.items);
			console.log(r);
		});
	}
})