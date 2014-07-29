Template.roomsList.helpers({
  rooms: function() {
    return Rooms.find();
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