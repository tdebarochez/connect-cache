var cache = require('../lib/connect-cache')
  , http = require('http')
  , connect = require('connect')
  , fs = require('fs')
  , assert = require('assert');

function run_server(port, opts, cb) {
  cb = cb || function () {};
  if (typeof opts === "function") {
    cb = opts;
    opts = {};
  }
  if (!opts) {
    opts = {}
  }
  if (!("rules" in opts)) {
    opts.rules = [{regex: /path.*|test.jpg/i, ttl: 1000}];
  }
  if (!("loopback" in opts)) {
    opts.loopback = 'localhost:' + port;
  }
  var server = connect.createServer(cache(opts),
                                    function (req, res) {
                                      if (req.url == '/') {
                                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                                        res.end('direct result');
                                      }
                                      else if (req.url == '/path' || req.url == '/Path') {
                                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                                        setTimeout(function () {
                                          res.end('cached result');
                                        }, 500);
                                      }
                                      else if (req.url == '/test.jpg') {
                                        var img = fs.readFileSync('static/test.jpg');
                                        res.writeHead(200,{'Content-Type': 'image/jpeg',
                                                           'Content-Length': img.length});
                                        res.end(img);
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
          server.close();
          assert.equal(body, 'direct result');
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
              server.close();
              assert.strictEqual(+new Date - start <= 500, true);
              assert.strictEqual(body, 'cached result');
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
        var chunks = [];
        response.on('data', function (chunk) {
          chunks.push(chunk);
        });
        response.on('end', function () {
          var offset = 0;
          chunks.forEach(function (chunk) {
            offset += chunk.length;
          });
          assert.strictEqual(offset, fs.readFileSync('./static/test.jpg', 'binary').length);
          fs.renameSync('./static/test.jpg', 'static/test.jpg_');
          http.get(options, function (response) {
            assert.strictEqual(response.statusCode, 200);
            var chunks = [];
            response.on('data', function (chunk) {
              chunks.push(chunk);
            });
            response.on('end', function () {
              server.close();
              var offset = 0;
              chunks.forEach(function (chunk) {
                offset += chunk.length;
              });
              assert.strictEqual(offset, fs.readFileSync('./static/test.jpg_', 'binary').length);
              fs.renameSync('./static/test.jpg_', 'static/test.jpg');
            });
          });
        });
      });
    });
  },
  "insensitive url": function () {
    var server = run_server(3465, {"sensitive": false}, function (server) {
      var options = {
        host: 'localhost',
        port: 3465,
        path: '/path'
      };
      http.get(options, function (response) {
        response.on('end', function () {
          options.path = '/Path';
          http.get(options, function (response) {
            assert.strictEqual(response.statusCode, 200);
            var body = '';
            response.on('data', function (chunk) {
              body += chunk;
            });
            response.on('end', function () {
              server.close();
              assert.strictEqual(body, 'cached result');
            });
          });
        });
      });
    });
  },

  "404": function () {
    var server = run_server(3466, function (server) {
      var options = {
        host: 'localhost',
        port: 3466,
        path: '/PAth'
      };
      http.get(options, function (response) {
        server.close();
        assert.strictEqual(response.statusCode, 404);
      });
    });
  }
};