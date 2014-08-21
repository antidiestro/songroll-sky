Template.userFavorites.helpers({
	favorites: function(){
		var favorites = Favorites.find({user_id: Meteor.userId()}).fetch();
		favorites.forEach(function(item,i){
			var youtubeCache = Cache.YouTube.findOne({youtube_id: item.youtube_id});
			if ( youtubeCache ) {
				console.log(youtubeCache);
				favorites[i].title = youtubeCache.cacheData.snippet.title;
				favorites[i].image_url = youtubeCache.cacheData.snippet.thumbnails.high.url;
				favorites[i].type = 'video';

				if ( item.spotify_id ) {
					var spotifyCache = Cache.Spotify.findOne({spotify_id: item.spotify_id});

					if ( spotifyCache ) {
						console.log(spotifyCache);
						favorites[i].title = spotifyCache.cacheData.name;
						favorites[i].artist_name = spotifyCache.cacheData.artists[0].name;
						favorites[i].type = 'song';
						if ( spotifyCache.cacheData.album.images[0] ) {
							favorites[i].image_url = spotifyCache.cacheData.album.images[1].url;
						}
					}
				}
			}

			
		})
		return favorites;
	}
});