// Move elements inside of an array
Array.prototype.move = function (old_index, new_index) {
  if (new_index >= this.length) {
      var k = new_index - this.length;
      while ((k--) + 1) {
          this.push(undefined);
      }
  }
  this.splice(new_index, 0, this.splice(old_index, 1)[0]);
  return this; // for testing purposes
};

// Shuffle an array randomly
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

// Obtain an array of values for a certain key iterating a Mongo cursor
keyArrayFromCursor = function(cursor, key) {
	if ( typeof key === 'undefined' ) { key = "_id"; }
	var values = [];
	cursor.fetch().forEach(function(item){
		if ( item[key] ) {
			values.push(item[key]);
		}
	});
	return values;
}

// Clean up the title of a video
cleanVideoName = function(video_title, track, artist){
  var finalVideoTitle = video_title;

  var trackName = track;
  var artistName = artist;

  // Always remove these characters from track name, artist name and final video title.
  var removeChars = ["-", "—", "~", "|", "(", ")", "[", "]", "'", "¿", "?", "!", "¡", ",", '"', "feat.", "feat", "ft.", "ft"];

  // Always remove these strings from the video title (case insensitive).
  var removeStrings = ["official video", "official audio", "lyrics video", "cover art", "video oficial", "original mix", "feat.", "feat", "ft.", "ft"];

  // Remove these strings, only if they are not part of the artist's or track's name.
  var removeIfMissing = ["lyrics", "audio", "official", "video", "oficial", "music", "hd"];

  // Build RegExp objects to check against video title.
  var removeRegex = [];

  var trackNameSplit = trackName.split('-');
  if ( trackNameSplit.length == 1 ) {
    trackNameSplit = trackName.split('—');  // caution, this is an "em dash"
  }

  trackNameSplit.forEach(function(trackNamePart){
    var trackNamePartFiltered = trackNamePart;
    removeChars.forEach(function(char){
      trackNamePartFiltered = trackNamePartFiltered.replace(char, '');
    });
    var regex = new RegExp(trackNamePartFiltered.trim(), 'gi');
    removeRegex.push(regex);
  });

  // Remove characters from artist name for later comparison.
  removeChars.forEach(function(char){
    artistName = artistName.replace(char, '');
  });

  var artistNameRegex = new RegExp(artistName, 'gi');
  removeRegex.push(artistNameRegex);

  // Remove characters from final video title
  removeChars.forEach(function(char){
    while ( finalVideoTitle.toLowerCase().indexOf(char) != -1 ) {
      finalVideoTitle = finalVideoTitle.replace(char, ' ');
    }
  });

  // Remove strings from video title
  removeStrings.forEach(function(string){
    var stringRegex = new RegExp(string, 'gi');
    finalVideoTitle = finalVideoTitle.replace(stringRegex, ' ');
  });

  // Remove strings if missing from video title
  removeIfMissing.forEach(function(string){
    if ( trackName.toLowerCase().indexOf(string) == -1 && artistName.toLowerCase().indexOf(string) == -1 ) {
      var stringRegex = new RegExp(string, 'gi');
      finalVideoTitle = finalVideoTitle.replace(stringRegex, ' ');
    }
  });

  removeRegex.forEach(function(regex){
    finalVideoTitle = finalVideoTitle.replace(regex, ' ');
  });

  finalVideoTitle = finalVideoTitle.replace(/\s+/g, " ");
  finalVideoTitle = finalVideoTitle.trim();

  console.log(finalVideoTitle);

  return finalVideoTitle;
}