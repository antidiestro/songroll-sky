Template.roomsList.helpers({
  rooms: function() {
    console.log('fetching rooms');
    var rooms = Rooms.find({}, { sort: { userCount: -1 } }).fetch();
    rooms.forEach(function(item, i){
      var currentVideo = Videos.findOne({room_id: item._id, nowPlaying: true});
      if ( currentVideo ) {
        rooms[i].now_playing = currentVideo;
      }
    });
    return rooms;
  }
});