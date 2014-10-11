// Collection handlers
Meteor.users.after.update(function(userId, doc, fieldNames, modifier){
  if ( modifier.$set ) {
    if ( typeof modifier.$set.currentRoom !== 'undefined' ) {
      if ( this.previous.currentRoom != modifier.$set.currentRoom ) {
        var pastRoom = Rooms.findOne({_id: this.previous.currentRoom});
        var nextRoom = Rooms.findOne({_id: modifier.$set.currentRoom});

        if ( pastRoom ) {
          var pastRoomCount = Meteor.users.find({currentRoom: pastRoom._id}).count();
          Rooms.update({_id: pastRoom._id}, { $set: { userCount: pastRoomCount } });
          Messages.insert({user_id: doc._id, room_id: pastRoom._id, isActivityMessage: true, activityType: 'leave'});
        }

        if ( nextRoom ) {
          Meteor.users.update({'status.online': false, currentRoom: nextRoom._id}, {$set: {currentRoom: 0}});
          var nextRoomCount = Meteor.users.find({currentRoom: nextRoom._id}).count();
          Rooms.update({_id: nextRoom._id}, { $set: { userCount: nextRoomCount } });
          Messages.insert({user_id: doc._id, room_id: nextRoom._id, isActivityMessage: true, activityType: 'join'});
        }
      }
    }
  }
});

Votes.after.insert(function(userId, doc){
  var videoVoteCount = Votes.find({video_id: doc.video_id}).count();
  Videos.update({_id: doc.video_id}, { $set: { voteCount: videoVoteCount } });
});

Votes.after.remove(function(userId, doc){
  var videoVoteCount = Votes.find({video_id: doc.video_id}).count();
  Videos.update({_id: doc.video_id}, { $set: { voteCount: videoVoteCount } });
});

Skips.after.insert(function(userId, doc){
  var skipsCount = Skips.find({video_id: doc.video_id}).count();
  var video = Videos.findOne({_id: doc.video_id});
  var userCount = Meteor.users.find({currentRoom: video.room_id}).count();
  if ( skipsCount > (userCount/2) ) {
    Sky.playNext(video._id);
    Skips.remove({video_id: doc.video_id});
  }
});

Messages.before.insert(function(userId, doc){
  var now = Date.now();
  doc.createdAt = now;
});

Favorites.before.insert(function(userId, doc){
  var now = Date.now();
  doc.createdAt = now;
});

Rooms.before.insert(function(userId, doc){
  doc.user_id = userId;
  doc.generatingRecommendations = false;
  doc.userCount = 0;
});

Videos.before.insert(function(userId, doc){
  var now = Date.now();
  doc.createdAt = now;
  doc.didPlay = false;
  doc.voteCount = 0;
  doc.nowPlaying = false;
});

Videos.after.insert(function(userId, doc){

  if ( userId ) {
    Messages.insert({room_id: doc.room_id, video_id: doc._id, user_id: userId, isActivityMessage: true, activityType: 'addVideo'});   
  }

  var now = Date.now();

  // Is there another video playing right now in this room?
  var currentVideo = Videos.find({room_id: doc.room_id, nowPlaying: true}).fetch();
  if ( currentVideo.length == 0 ) {
    Sky.playVideo(doc);
  }

  if ( doc.type == 'video' && doc.source == 'youtube' ) {

    Meteor.setTimeout(function(){
      Sky.api.spotify.checkVideoForMusic(doc);
    }, 0);
  } else if ( doc.type == 'track' && doc.source == 'spotify' ) {
    Sky.api.spotify.cacheArtistData(doc.spotify_artist_id);
  }
});