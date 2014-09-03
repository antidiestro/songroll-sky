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