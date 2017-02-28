var express = require('express')
  , assert = require('assert')
  , http = require('http')
  , cache = require('../lib/connect-cache')({
    rules: [{regex: /.*/, ttl: 1000}]
});

function run_server(cb) {
  var web = express();
  web.use(cache)

  web.get('/', function(req, res) {
      res.contentType('text/csv');
      res.send('example, csv, string\n2nd, line\n');
  });

  var server = http.createServer(web);
  server.listen(3565, function () {
    cb(server);
  });
}

module.exports = {'csv headers': function () {
  run_server(function (server) {
    var options = {
      host: 'localhost',
      port: 3565,
      path: '/'
    };
    http.get(options, function (response) {
      server.close();
      assert.ok(response.headers['content-type'].match(/text\/csv/i));
    });
  });
}};
