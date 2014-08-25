Template.userFavorites.rendered = function(){
	$('.actions a:not(.tooltip-active)').addClass('tooltip-active').tooltip();
	masonryAdjust();
	$(window).on('resize', function(){
		masonryAdjust();
	});
}

Template.userFavorites.destroyed = function(){
	$(window).off('resize');
}

masonryAdjust = function(){
	var columnWidth = 235;
	var columnGutter = 20;
	var fullWidth = columnWidth+columnGutter;
	var columns = Math.floor($(window).width()/fullWidth);
	var masonryWidth = columns*fullWidth;
	$('.masonry').width(masonryWidth);
	$('.masonry-adjust').width(masonryWidth-columnGutter);
}

processFavorites = function(array){
	favorites = array;
	favorites.forEach(function(item,i){
		var youtubeCache = Cache.YouTube.findOne({youtube_id: item.youtube_id});
		if ( youtubeCache ) {
			console.log(youtubeCache);
			favorites[i].title = youtubeCache.cacheData.snippet.title;
			favorites[i].image_url = youtubeCache.cacheData.snippet.thumbnails.high.url;
			favorites[i].author = youtubeCache.cacheData.snippet.channelTitle;
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
				} else {
					localCache.spotify.push(item.spotify_id);
					localCacheDeps.spotify.changed();
				}
			}
		} else {
			localCache.youtube.push(item.youtube_id);
			localCacheDeps.youtube.changed();
		}
	});
	return favorites;
}

Template.userFavorites.helpers({
	favoriteSongs: function(){
		var favorites = Favorites.find({user_id: Meteor.userId(), spotify_id: { $exists: true }}, { sort: { createdAt: -1 } }).fetch();
		return processFavorites(favorites);
	},
	favoriteVideos: function(){
		var favorites = Favorites.find({user_id: Meteor.userId(), spotify_id: { $exists: false }, youtube_id: { $exists: true }}, { sort: { createdAt: -1 } }).fetch();
		return processFavorites(favorites);
	}
});

Template.userFavorites.events({
	'shown.bs.tab a[data-toggle="tab"]': function(e){
		var fc = $('.favorite-items-container.active .favorites-item').length;
		$('.fav-count .count').text(fc);
	}
})