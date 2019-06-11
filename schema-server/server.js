const express = require('express'),
path = require('path');

var app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.listen(3000, function () {
	console.log('schema-server listening on port ' + 3000 + '!');
});
