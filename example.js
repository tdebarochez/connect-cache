var cache = require('./lib/connect-cache');
var connect = require('connect');

function helloWorld(req, res) {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  if (req.url == '/') {
    res.write('no cached result');
  }
  if (req.url == '/path') {
    res.write('cached result');
  }
  res.end('');
}
var server = connect.createServer(cache({regex: /path/,
                                         ttl: 60}),
                                  helloWorld);

server.listen(3000);