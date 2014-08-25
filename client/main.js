Meteor.subscribe('userData');
Meteor.subscribe('userFavorites');
Meteor.subscribe('indexRooms');

windowWidth = $(window).width();
windowWidthDependency = new Deps.Dependency;

localCache = {
	youtube: [],
	spotify: [],
	spotifyArtists: []
}

localCacheDeps = {}
localCacheDeps.spotifyArtists = new Deps.Dependency;
localCacheDeps.spotify = new Deps.Dependency;
localCacheDeps.youtube = new Deps.Dependency;

Deps.autorun(function(){
	localCacheDeps.spotifyArtists.depend();
	Meteor.subscribe('spotifyArtistCache', localCache.spotifyArtists);
});

Deps.autorun(function(){
	localCacheDeps.spotify.depend();
	Meteor.subscribe('spotifyCache', localCache.spotify);
});

Deps.autorun(function(){
	localCacheDeps.youtube.depend();
	Meteor.subscribe('youtubeCache', localCache.youtube);
});

$(function(){
	$(window).resize(function(){
		windowWidth = $(window).width();
		windowWidthDependency.changed();
	});
});