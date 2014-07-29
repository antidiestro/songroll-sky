function youtube_parser(url){
    var regExp = /.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/;
    var match = url.match(regExp);
    if (match&&match[1].length==11){
        return match[1];
    } else {
        return false;
    }
}

window.onYouTubeIframeAPIReady = function(){
	player = new YT.Player('player');
}

Template.roomPage.helpers({
	videoList: function(){
		return Videos.find({room_id: this._id});
	},
	timeFormat: function(timestamp){
		return moment(timestamp).format('HH:mm');
	}
});

Deps.autorun(function(){
	var latest_video = Videos.findOne({}, {sort:{_id:-1}});
	if (latest_video) {
		console.log('Latest video is now '+latest_video.title);
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