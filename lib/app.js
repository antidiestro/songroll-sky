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

shuffleArray = function(array) {
  var currentIndex = array.length
    , temporaryValue
    , randomIndex
    ;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

Array.prototype.move = function (old_index, new_index) {
  if (new_index >= this.length) {
      var k = new_index - this.length;
      while ((k--) + 1) {
          this.push(undefined);
      }
  }
  this.splice(new_index, 0, this.splice(old_index, 1)[0]);
  return this; // for testing purposes
};