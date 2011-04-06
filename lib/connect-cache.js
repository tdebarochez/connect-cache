/**
 * options : {regex: /path/, ttl: 60, cache_path: 'cache/'}
 */
var utils = require('connect/utils'),
    fs = require('fs');

var cache_path = 'cache/'; // default cache path

exports = module.exports = function (options) {
  if ('cache_path' in options) {
    cache_path = options.cache_path;
  }
  return function (req, res, next) {
    if (!options.regex.test(req.url) || req.query.no_cache == "1") {
      next();
    }
    getCache(req, options.ttl, function (err, content) {
      if (err) throw err;
      if (content === false) {
        getcontent(req, function (content) {
          setCache(req, content);
          res.send(content)
        });
      }
      else {
        return res.end(content);
      }
    });
  }
};

function getContent(req, cb) {
  var content = new Buffer('', 'binary');
  var http = require('http');
  var req_path = req.path;
  req_path += (/\?/.test(req_path) ? '&' : '?') + 'no_cache=1';
  var options = {host: req.host,
                 port: req.port,
                 path: req_path,
                 method: req.method};
  http.request(options, function(res) {
    res.setEncoding('binary');
    res.on('data', function (chunk) {
      content.write(chunk)
    });
    res.on('end', function () {
      cb && cb(content);
    });
  });
}

function getCache(req, ttl, cb) {
  var hash = utils.md5(req.path);
  fs.stat(cache_path + hash, function (err, stats) {
    if (err) throw err;
    if (+new Date(stats.mtime) > (+new Date + ttl)) {            
      fs.readFile(cache_path + hash, 'binary', cb);
    }
    cb(false);
  });
}

function setCache(req, content) {
  var hash = utils.md5(req.path);
  fs.writeFile(cache_path + hash, content, 'binary');
}