contextDependency = new Deps.Dependency;

// Initialize my collections
Rooms = new Meteor.Collection("rooms");
Videos = new Meteor.Collection("videos");
Messages = new Meteor.Collection("messages");
Votes = new Meteor.Collection("votes");

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