var utils = require('connect').utils;

var storage = null;

exports = module.exports = function (options) {
  options = options || {};
  if (typeof options.regex !== "function") {
    throw new Error('you must define regex option');
  }
  options.ttl = options.ttl || 3600000;
  if (!('storage' in options)) {
    options.storage = require('./basic-storage');
  }
  storage = new options.storage(options.storage_options || {});
  return function (req, res, next) {
    if (req.method !== 'GET'
        || !options.regex.test(req.url)
        || req.headers['x-no-cache'] == "1") {
      return next();
    }
    var key = utils.md5(req.url),
      content_key = 'c' + key,
      metas_key = 'm' + key,
      cached_content = null,
      cached_metas = null,
      onCachedContentRetrieved = function () {   
        if (cached_content === null || cached_metas === null) {
          return;
        }
        if (cached_content === false || cached_metas === false) {
          getContent(req, function (metas, content) {
            storage.set(content_key, content);
            storage.set(metas_key, JSON.stringify(metas));
            setTimeout(function () {
              storage.remove(content_key);
              storage.remove(metas_key);
            }, options.ttl);
            res.headers = metas.headers;
            res.statusCode = metas.statusCode;
            res.end(content)
          });
        }
        else {
          var metas = JSON.parse(cached_metas);
          res.headers = metas.headers;
          res.statusCode = metas.statusCode;
          res.end(cached_content);
        }
      };
    storage.get(content_key, function (err, content) {
      if (err) throw err;
      cached_content = content;
      onCachedContentRetrieved();
    });
    storage.get(metas_key, function (err, content) {
      if (err) throw err;
      cached_metas = content;
      onCachedContentRetrieved();
    });
  }
};

function getContent(req, cb) {
  req.headers['x-no-cache'] = 1;
  var tmp = req.headers.host.split(':');
  var req_host = tmp[0];
  var req_port = tmp.length > 1 ? tmp[1] : 80;
  var length = 0;
  var chunks = [];
  var request = require('http').createClient(req_port, req_host).request(req.method, req.url, req.headers);
  request.end();
  request.on('response', function (res) {
    res.setEncoding('binary');
    res.on('data', function (chunk) {
      chunks.push(new Buffer(chunk, 'binary'));
      length += chunk.length;
    });
    res.on('end', function () {
      var content = new Buffer(length);
      var offset = 0;
      chunks.forEach(function (chunk) {
        chunk.copy(content, offset);
        offset += chunk.length;
      });
      cb && cb({headers: res.headers, statusCode: res.statusCode}, content);
    });
  });
}