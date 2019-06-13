const fs = require('fs'),
express = require('express'),
commandLineArgs = require('command-line-args'),
commandLineUsage = require('command-line-usage');

var app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.listen(80, function () {
	console.log('schema-visualiser listening on port ' + 80 + '!');
});
