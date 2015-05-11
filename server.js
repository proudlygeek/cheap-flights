//    baseUrl = /flights/from/DUB/to/CIA/2015-01-02/2015-10-02/250/unique/?limit=15&offset-0
var express = require('express'),
    app     = express(),
    http    = require('http'),
    url     = require('url'),
    baseUrl = 'http://www.ryanair.com/en/api/2';

app.use(express.static('public'));
app.use(express.static('node_modules'));

app.get('/api/*', function(request, response) {
  var options = url.parse(request.url),
      path = options.path.replace(/api/, '');

  var connector = http.get(baseUrl + path, function(res) {
    res.pipe(response, { end: true });
  });

  request.pipe(connector, { end: true });
});

app.listen(9000, function() {
  console.log('Server listening on :9000');
});
