Sky.api = {
	youTube: {
		search: function(query, limit){
			limit = typeof limit !== 'undefined' ? limit : '20';
			Sky.log('api,youtube', 'Searching for "'+query+'", limit: '+limit);
			return Meteor.http.get('https://www.googleapis.com/youtube/v3/search?part=id,snippet&q='+encodeURIComponent(query)+'&maxResults='+limit+'&type=video&key=AIzaSyCjkQ_YauVPcAHM541qjYVtWOX7kjYFSlE').data;
		},
		videoInfo: function(video_id){
			Sky.log('api,youtube', 'Retrieving info for ID '+video_id);
			var videoInfo = Meteor.http.get('https://www.googleapis.com/youtube/v3/videos?part=id%2Csnippet%2CcontentDetails&id='+video_id+'&maxResults=1&key=AIzaSyCjkQ_YauVPcAHM541qjYVtWOX7kjYFSlE');
			return videoInfo.data.items[0];
		},
		similarVideos: function(video_id){
			Sky.log('api,youtube', 'Retrieving similar videos for ID '+video_id);
			return Meteor.http.get('https://www.googleapis.com/youtube/v3/search?part=id&relatedToVideoId='+video_id+'&type=video&key=AIzaSyCjkQ_YauVPcAHM541qjYVtWOX7kjYFSlE&maxResults=15').data;
		}
	},
	theEchoNest: {
		similarTracks: function(track_id, artist_id) {
			Sky.log('api,echonest', 'Retrieving similar tracks for Artist: "'+artist_id+'", Track: "'+track_id+'"');

			var requestUrlTrack = 'http://developer.echonest.com/api/v4/playlist/static?api_key=ITP9G1EXT2LX09OWG&song_id=spotify:track:'+track_id+'&format=json&results=20&type=song-radio';
			var requestUrlArtist = 'http://developer.echonest.com/api/v4/playlist/static?api_key=ITP9G1EXT2LX09OWG&artist_id=spotify:artist:'+artist_id+'&format=json&results=20&type=artist-radio';
			
			var similarTracks = Meteor.http.get(requestUrlTrack);

			if ( similarTracks.data.response.status.code != 0 ) {
				Sky.log('api,echonest', 'No track radio for "'+track_id+'" could be built, falling back to artist "'+artist_id+'" radio.');
				similarTracks = Meteor.http.get(requestUrlArtist);
			}

			return similarTracks.data.response.songs;
		}
	},
	spotify: {
		search: function(query, limit){
			limit = typeof limit !== 'undefined' ? limit : '20';
			Sky.log('api,spotify', 'Searching for "'+query+'", limit: '+limit);
			// Pending: look for songs with same artist+title combo and remove if dupe.
			return Meteor.http.get('https://api.spotify.com/v1/search?q='+encodeURIComponent(query)+'&type=track').data;
		}
	}
}