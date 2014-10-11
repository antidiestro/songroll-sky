Timeouts = {};

// Initialize my collections
Rooms = new Meteor.Collection("rooms");
Videos = new Meteor.Collection("videos");
Messages = new Meteor.Collection("messages");
Votes = new Meteor.Collection("votes");
Favorites = new Meteor.Collection("favorites");
Skips = new Meteor.Collection("skips");

Cache = {};
Cache.Spotify = new Meteor.Collection("cache_spotify");
Cache.YouTube = new Meteor.Collection("cache_youtube");
Cache.Echonest = new Meteor.Collection("cache_echonest");
Cache.Freebase = new Meteor.Collection("cache_freebase");

// Dependencies for YouTube player
youtubeApiReady = false;
youtubePlayerReady = false;

youtubeApiDependency = new Deps.Dependency;
youtubePlayerDependency = new Deps.Dependency;

onYouTubeIframeAPIReady = function(){
	youtubeApiReady = true;
	youtubeApiDependency.changed();
}

ServiceConfiguration.configurations.remove({
  service: "twitter"
});
ServiceConfiguration.configurations.insert({
  service: "twitter",
  consumerKey: APIKeys.twitter.consumerKey,
  secret: APIKeys.twitter.secret
});