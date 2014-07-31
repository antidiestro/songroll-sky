Template.roomsList.helpers({
  rooms: function() {
    console.log('fetching rooms');
    var rooms = Rooms.find().fetch();
    rooms.forEach(function(item, i){
      var currentVideo = Videos.findOne({room_id: item._id, nowPlaying: true});
      if ( currentVideo ) {
        rooms[i].now_playing = currentVideo;
      }
    });
    return rooms;
  }
});

Template.roomsList.events({
  'click input': function () {
    var name = prompt('Enter a name for your room.');
    
    if ( name ) {
      Rooms.insert({title: name});
    }

    // template data, if any, is available in 'this'
    if (typeof console !== 'undefined')
      console.log("You pressed the button");
  }
});