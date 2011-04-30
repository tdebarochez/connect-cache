var express = require('express')
  , assert = require('assert')
  , http = require('http')
  , cache = require('../lib/connect-cache')({
    rules: [{regex: /.*/, ttl: 1000}]
});

function run_server(cb) {
  var web = express.createServer(cache);

  web.get('/', function(req, res) {
      res.contentType('text/csv');
      res.send('example, csv, string\n2nd, line\n');
  });

  web.listen(3565, function () {
    cb(web);
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
      assert.equal(response.headers['content-type'], 'text/csv');
      server.close();
    });
  });
}};
