var express = require('express'),
    app     = express(),
    http    = require('http'),
    url     = require('url');

app.use(express.static('public'));
app.use(express.static('node_modules'));

app.get('/cors/*', function(request, response) {
  var options = url.parse(request.url),
      path = options.path.replace(/\/cors\//, '');

  var connector = http.get(path, function(res) {
    response.setHeader('Content-Type', 'application/json');
    res.pipe(response, { end: true });
  });

  request.pipe(connector, { end: true });
});

app.listen(9000, function() {
  console.log('Server listening on :9000');
});
