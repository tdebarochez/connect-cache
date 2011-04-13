var cache = require('../lib/connect-cache')
  , http = require('http')
  , connect = require('connect')
  , fs = require('fs')
  , assert = require('assert');

function run_server(port, cb) {
  var server = connect.createServer(cache({regex: /path.*|test.jpg/,
                                           loopback: 'localhost:' + port,
                                           ttl: 60000}),
                                    function (req, res) {
                                      if (req.url == '/') {
                                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                                        res.end('direct result');
                                      }
                                      else if (req.url == '/path') {
                                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                                        setTimeout(function () {
                                          res.end('cached result');
                                        }, 500);
                                      }
                                      else if (req.url == '/test.jpg') {
                                        var img = fs.readFileSync('static/test.jpg', 'binary');
                                        res.writeHead(200,{'Content-Type': 'image/jpeg',
                                                           'Content-Length': img.length});
                                        res.end(img, 'binary');
                                      }
                                      else {
                                        res.writeHead(404, { 'Content-Type': 'text/plain' });
                                        res.end('not found');
                                      }
                                    });
  server.listen(port, function () {
    cb(server);
  });
  return server;
}

module.exports = {
  "direct result": function () {
    run_server(3462, function (server) {
      var options = {
        host: 'localhost',
        port: 3462,
        path: '/'
      };
      http.get(options, function (response) {
        assert.strictEqual(response.statusCode, 200);
        var body = '';
        response.on('data', function (chunk) {
          body += chunk;
        });
        response.on('end', function () {
          assert.equal(body, 'direct result');
          server.close();
        });
      });
    });
  },
  "cached result": function () {
    run_server(3463, function (server) {
      var options = {
        host: 'localhost',
        port: 3463,
        path: '/path'
      };
      var start = +new Date;
      http.get(options, function (response) {
        assert.strictEqual(response.statusCode, 200);
        var body = '';
        response.on('data', function (chunk) {
          body += chunk;
        });
        response.on('end', function () {
          assert.strictEqual(+new Date - start >= 500, true);
          assert.strictEqual(body, 'cached result');
          start = +new Date;
          http.get(options, function (response) {
            assert.strictEqual(response.statusCode, 200);
            var body = '';
            response.on('data', function (chunk) {
              body += chunk;
            });
            response.on('end', function () {
              assert.strictEqual(+new Date - start <= 500, true);
              assert.strictEqual(body, 'cached result');
              server.close();
            });
          });
        });
      });
    });
  },
  "binary result": function () {
    var server = run_server(3464, function (server) {
      var options = {
        host: 'localhost',
        port: 3464,
        path: '/test.jpg'
      };
      http.get(options, function (response) {
        assert.strictEqual(response.statusCode, 200);
        var chunks = []
          , length = 0;
        response.on('data', function (chunk) {
          chunks.push(new Buffer(chunk, 'binary'));
          length += chunk.length;
        });
        response.on('end', function () {
          var content = new Buffer(length);
          var offset = 0;
          chunks.forEach(function (chunk) {
            chunk.copy(content, offset);
            offset += chunk.length;
          });
          assert.strictEqual(length, fs.readFileSync('./static/test.jpg', 'binary').length);
          fs.renameSync('./static/test.jpg', 'static/test.jpg_');
          http.get(options, function (response) {
            assert.strictEqual(response.statusCode, 200);
            var chunks = [];
            response.on('data', function (chunk) {
              chunks.push(new Buffer(chunk, 'binary'));
              length += chunk.length;
            });
            response.on('end', function () {
              server.close();
              var content = new Buffer(length);
              var offset = 0;
              chunks.forEach(function (chunk) {
                chunk.copy(content, offset);
                offset += chunk.length;
              });
              assert.strictEqual(length, fs.readFileSync('./static/test.jpg_', 'binary').length);
              fs.renameSync('./static/test.jpg_', 'static/test.jpg');
            });
          });
        });
      });
    });
  }
};