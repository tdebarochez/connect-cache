var express = require('express')
  , assert = require('assert')
  , http = require('http')
  , cache = require('../lib/connect-cache')({
    regex: /\/stocks\/.+/
});

var web = express.createServer(cache);

web.get('/stocks/:symbol', function(req, res) {
    res.contentType('text/csv');
    require('http').get({  // get stock history
        host: 'ichart.finance.yahoo.com',
        path: '/table.csv?s=' + req.params.symbol
    }, function(csv) {
        csv.pipe(res);
    });
});

web.listen(3465);

module.exports = {'csv headers': function () {
  var options = {
    host: 'localhost',
    port: 3465,
    path: '/stocks/yoku'
  };
  http.get(options, function (response) {
    assert.equal(response.headers['content-type'], 'text/csv');
    web.close();
  });
}};
