function youtube_parser(url){
    var regExp = /.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/;
    var match = url.match(regExp);
    if (match&&match[1].length==11){
        return match[1];
    } else {
        return false;
    }
}

var playerDependency = new Deps.Dependency;

var Player = {
	el: false,
	setup: function(){
		Template.roomPage.player = new YT.Player('player');
	}
}

window.onYouTubeIframeAPIReady = function(){
	Player.setup();
}

Template.roomPage.helpers({
	videoList: function(){
		return Videos.find({room_id: this._id});
	},
	timeFormat: function(timestamp){
		return moment(timestamp).format('HH:mm');
	}
});

Template.roomPage.rendered = function() {
	if ( YT ) {
		Player.setup();
	}
}

Deps.autorun(function(){
	if ( typeof YT !== 'undefined' ) {
		var latest_video = Videos.findOne({}, { sort: {createdAt: -1} });
		Template.roomPage.player.loadVideoById(latest_video.youtube_id);
	}
});

Template.roomPage.helpers({
	videoList: function(){
		return Videos.find({room_id: this._id});
	},
	timeFormat: function(timestamp){
		return moment(timestamp).format('HH:mm');
	}
});

Template.roomPage.events({
	'click #add-video': function(){
		var room_id = this._id;
		var url = prompt('Ingresa una URL de un video de YouTube');
		if ( url ) {
			var id = youtube_parser(url);
			if ( id ) {
				console.log('Cargando video con id '+id);
				Meteor.call('getVideoInfo', id, function(e, r) {
					console.log(r);
					var data = {room_id: room_id, youtube_id: r.id, title: r.snippet.title, duration: moment.duration(r.contentDetails.duration).asSeconds()};
					console.log(data);
					Videos.insert(data);
				});
			}
		}
	}
});