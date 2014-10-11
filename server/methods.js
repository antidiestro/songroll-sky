Meteor.methods({
  serverTime: function(){
    return Date.now();
  },
  toggleVote: function(video_id){
    var vote_check = Votes.findOne({user_id: Meteor.userId(), video_id: video_id});
    if ( vote_check ) {
      Votes.remove({user_id: Meteor.userId(), video_id: video_id});
    } else {
      Votes.insert({user_id: Meteor.userId(), video_id: video_id});
    }
  },
  insertSpotifySong: function(track, room_id){
    var videoInfo;
    var cacheCheck = Cache.Spotify.findOne({spotify_id: track.id});

    if ( cacheCheck && cacheCheck.youtube_id ) {
      videoInfo = Sky.api.youTube.videoInfo(cacheCheck.youtube_id);
    } else {
      var query = track.name+' '+track.artist_name;
      var youtubeSearch = Sky.api.youTube.search(query, 1);
      if ( youtubeSearch.items.length > 0 ) {
        videoInfo = Sky.api.youTube.videoInfo(youtubeSearch.items[0].id.videoId);
        if ( cacheCheck ) {
          Cache.Spotify.update({_id: cacheCheck._id}, { $set: { youtube_id: youtubeSearch.items[0].id.videoId } });
        } else {
          Cache.Spotify.insert({spotify_id: track.id, youtube_id: youtubeSearch.items[0].id.videoId, cacheData: track});
        }
      } else {
        console.log('Video not found.');
        return;
      }
    }

    var data = {
      room_id: room_id, 
      youtube_id: videoInfo.id, 
      title: track.name, 
      artist_name: track.artist_name, 
      duration: moment.duration(videoInfo.contentDetails.duration).asSeconds(), 
      type: 'track', 
      source: 'spotify', 
      spotify_id: track.id,
      spotify_artist_id: track.artists[0].id,
      isAnalyzed: true
    };

    if ( track.image_url ) {
      data.image_url = track.image_url;
    }
    
    var thisVideo = Videos.insert(data);
    if ( Meteor.userId() ) {
      Votes.insert({user_id: Meteor.userId(), video_id: thisVideo});
    }
  },
  insertYouTubeVideo: function(video, room_id){
    var videoInfo = Sky.api.youTube.videoInfo(video.id.videoId);
    var data = {
      room_id: room_id, 
      youtube_id: videoInfo.id, 
      title: videoInfo.snippet.title, 
      duration: moment.duration(videoInfo.contentDetails.duration).asSeconds(), 
      image_url: videoInfo.snippet.thumbnails.high.url, 
      type: 'video', 
      source: 'youtube',
      isAnalyzed: false,
      youtube_info: videoInfo
    };

    var thisVideo = Videos.insert(data);
    if ( Meteor.userId() ) {
      Votes.insert({user_id: Meteor.userId(), video_id: thisVideo});
    }
  },
  searchSpotify: function(query){
    return Sky.api.spotify.search(query);
  },
  searchYouTube: function(query){
    return Sky.api.youTube.search(query);
  }
});