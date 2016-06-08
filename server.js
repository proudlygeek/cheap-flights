var express = require('express'),
    app     = express(),
    https   = require('https'),
    url     = require('url');

app.use(express.static('public'));
app.use(express.static('node_modules'));

app.set('port', (process.env.PORT || 9000));

app.get('/cors/*', function(request, response) {
  var options = url.parse(request.url),
      path = options.path.replace(/\/cors\//, '');

  var connector = https.get(path, function(res) {
    response.setHeader('Content-Type', 'application/json');
    res.pipe(response, { end: true });
  });

  request.pipe(connector, { end: true });
});

app.listen(app.get('port'), function() {
  console.log('Server listening on ' + app.get('port'));
});
