var express = require('express')
  , assert = require('assert')
  , http = require('http')
  , cache = require('../lib/connect-cache')({
    regex: /.*/
});

var web = express.createServer(cache);

web.get('/', function(req, res) {
    res.contentType('text/csv');
    res.send('example, csv, string\n2nd, line\n');
});

web.listen(3465);

module.exports = {'csv headers': function () {
  var options = {
    host: 'localhost',
    port: 3465,
    path: '/'
  };
  http.get(options, function (response) {
    web.close();
    assert.equal(response.headers['content-type'], 'text/csv');
  });
}};