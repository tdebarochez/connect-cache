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
      , onCachedContentRetrieved = function (cached_metas, cached_content) {
        req.headers['x-no-cache'] = 1;
        var tmp = req.headers.host.split(':')
          , req_host = tmp[0]
          , req_port = tmp.length > 1 ? tmp[1] : 80
          , client = http.createClient(req_port, req_host)
          , request = client.request(req.method, req.url, req.headers);
        request.end();
        request.on('response', function (response) {
          if (cached_metas === false) {
            res.headers = response.headers;
            res.statusCode = response.statusCode;
            var metas = {statusCode: response.statusCode,
                         headers: response.headers};
            storage.set(metas_key, JSON.stringify(metas));
            setTimeout(function () {
              storage.remove(metas_key);
            }, options.ttl);
          }
          if (cached_content !== false) {
            if ('getStream' in storage) {
              cached_content.pipe(res);
            }
            else {
              res.end(cached_content);
            }
            return;
          }
          response.setEncoding('binary');
          response.on('end', function () {
            setTimeout(function () {
              storage.remove(content_key);
            }, options.ttl);
          });
          response.pause();
          if ('setStream' in storage) {
            storage.setStream(content_key, function (err, h) {
              if (err) throw err;
              response.pipe(h);
              response.pipe(res);
              response.resume();
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
            response.pipe(res);
            response.resume();
          }
        });
      };
    storage.get(metas_key, function (err, cached_metas) {
      if (err) throw err;
      if (cached_metas !== false) {
        var metas = JSON.parse(cached_metas);
        res.headers = metas.headers;
        res.statusCode = metas.statusCode;
      }
      if ('getStream' in storage) {
        storage.getStream(content_key, function (handle) {
          if (handle !== false && cached_metas !== false) {
            return handle.pipe(res);
          }
          onCachedContentRetrieved(cached_metas, handle);
        });
      }
      else {
        storage.get(content_key, function (err, cached_content) {
          if (err) throw err;
          if (cached_content !== false && cached_metas !== false) {
            return res.end(cached_content);
          }
          onCachedContentRetrieved(cached_metas, cached_content);
        });
      }
    });
  }
};
