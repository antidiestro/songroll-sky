Rooms = new Meteor.Collection("rooms");
Videos = new Meteor.Collection("videos");

Videos.before.insert(function(userId, doc){
  doc.createdAt = Date.now();
});
