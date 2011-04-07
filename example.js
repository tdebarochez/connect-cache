var cache = require('./lib/connect-cache');
var connect = require('connect');

function helloWorld(req, res) {
  if (req.url == '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write('direct result');
    res.end('');
  }
  else if (req.url == '/path') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    setTimeout(function () {
      res.write('cached result');
      res.end('');
    }, 1000);
  }
  else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.write('not found');
    res.end('');
  }
}
var server = connect.createServer(cache({regex: /path.*/,
                                         ttl: 60000}),
                                  helloWorld);

server.listen(3000);