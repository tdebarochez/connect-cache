var utils = require('connect').utils
  , http = require('http');

var storage = null;

exports = module.exports = function (options) {
  options = options || {};
  if (typeof options.regex !== "function") {
    throw new Error('you must define regex option');
  }
  options.ttl = options.ttl || 3600000;
  if (!('storage' in options)) {
    storage = new (require('./basic-storage'));
  }
  else {
    storage = options.storage;
  }
  return function (req, res, next) {
    if (req.method !== 'GET'
        || !options.regex.test(req.url)
        || req.headers['x-no-cache'] == "1") {
      return next();
    }
    var key = utils.md5(req.url)
      , content_key = 'c' + key
      , metas_key = 'm' + key
      , cached_content = null
      , cached_metas = null
      , onCachedContentRetrieved = function () {
        if (cached_content === null || cached_metas === null) {
          return;
        }
        if (cached_content === false || cached_metas === false) {
          req.headers['x-no-cache'] = 1;
          var tmp = req.headers.host.split(':')
            , req_host = tmp[0]
            , req_port = tmp.length > 1 ? tmp[1] : 80
            , client = http.createClient(req_port, req_host)
            , request = client.request(req.method, req.url, req.headers);
          request.end();
          request.on('response', function (response) {
            res.headers = response.headers;
            res.statusCode = response.statusCode;
            response.setEncoding('binary');
            response.pipe(res);
            if ('setStream' in storage) {
              storage.setStream(content_key, function (h) {
                response.pipe(h);
              });
            }
            else {
              var length = 0
                , chunks = [];
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
                storage.set(content_key, content);
              });
            }
            response.on('end', function () {
              var metas = {statusCode: response.statusCode,
                           headers: response.headers};
              storage.set(metas_key, JSON.stringify(metas));
              setTimeout(function () {
                storage.remove(content_key);
                storage.remove(metas_key);
              }, options.ttl);
            });
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
