var utils = require('connect').utils
  , http = require('http')
  , url = require('url');

var storage = null
  , default_ttl = 3600000;

exports = module.exports = function (options) {
  options = options || {};
  if (!Array.isArray(options.rules)) {
    console.log('DEPRECATED : options.rules must be a set of regular expressions/ttl pairs');
    if (typeof options.regex !== "function") {
      throw new Error('you must define options.regex');
    }
    options.rules = [{regex: options.regex, ttl: options.ttl || default_ttl}];
  }
  if (options.rules.length < 1) {
    throw new Error('no rules');
  }
  if ("ttl" in options) {
    console.log('DEPRECATED : options.ttl usage');
  }
  if (!('storage' in options)) {
    storage = new (require('./storages/basic'));
  }
  else {
    storage = options.storage;
  }
  return function (req, res, next) {
    if (req.method !== 'GET'
        || req.headers['x-no-cache'] == "1") {
      return next();
    }
    var ttl = 0;
    var must_be_cached = false;
    options.rules.forEach(function (rule) {
      var match = rule.regex.test(req.url);
      if (match && ttl === 0) {
        ttl = Number(rule.ttl || default_ttl);
      }
      must_be_cached = must_be_cached || match;
    });
    if (!must_be_cached) {
      return next();
    }
    if (!('loopback' in options)) {
      if (!('host' in req.headers)) {
        throw new Error('host in HTTP headers must be defined');
      }
      options.loopback = req.headers.host;
    }
    if (!('sensitive' in options)) {
      options.sensitive = true;
    }
    else {
      options.sensitive = !!options.sensitive;
      if (!options.sensitive) {
        var url_hash = url.parse(req.url);
      }
    }
    var tmp = options.loopback.split(':')
      , loopback_host = tmp[0]
      , loopback_port = tmp.length > 1 ? tmp[1] : 80
      , key = !options.sensitive
              ? utils.md5(url_hash.pathname.toLocaleLowerCase() + ("query" in url_hash ? '?' + url_hash.query : ''))
              : utils.md5(req.url)
      , content_key = 'c' + key
      , metas_key = 'm' + key
      , onCachedContentRetrieved = function (cached_metas, cached_content, write_stream) {
        req.headers['x-no-cache'] = 1;
        req.headers['x-forwarded-for'] = req.socket.remoteAddress;
        var client = http.createClient(loopback_port, loopback_host)
          , request = client.request(req.method, req.url, req.headers);
        request.end();
        request.on('response', function (response) {
          if (cached_metas === false) {
            for (var key in response.headers) {
              res.setHeader(key, response.headers[key]);
            }
            res.statusCode = response.statusCode;
            var metas = {statusCode: response.statusCode,
                         headers: response.headers};
            storage.set(metas_key, JSON.stringify(metas));
            setTimeout(function () {
              storage.remove(metas_key);
            }, ttl);
          }
          if (cached_content !== false) {
            if ('readStream' in storage) {
              cached_content.pipe(res);
            }
            else {
              res.end(cached_content);
            }
            return;
          }
          response.on('end', function () {
            setTimeout(function () {
              storage.remove(content_key);
            }, options.ttl);
          });
          if ('writeStream' in storage) {
            response.pipe(write_stream);
          }
          else {
            var length = 0
              , chunks = [];
            response.on('data', function (chunk) {
              chunks.push(chunk);
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
          response.pipe(res);
        });
      };
    storage.get(metas_key, function (err, cached_metas) {
      if (err) throw err;
      if (cached_metas !== false) {
        var metas = JSON.parse(cached_metas);
        for (var key in metas.headers) {
          res.setHeader(key, metas.headers[key]);
        }
        res.statusCode = metas.statusCode;
      }
      if ('readStream' in storage) {
        storage.readStream(content_key, function (err, read_stream) {
          if (err) throw err;
          if (read_stream !== false && cached_metas !== false) {
            return read_stream.pipe(res);
          }
          if ('writeStream' in storage) {
            storage.writeStream(content_key, function(err, write_stream) {
              if (err) throw err;
              onCachedContentRetrieved(cached_metas, read_stream, write_stream);
            });
          }
          else {
            onCachedContentRetrieved(cached_metas, read_stream);
          }
        });
      }
      else {
        storage.get(content_key, function (err, cached_content) {
          if (err) throw err;
          if (cached_content !== false && cached_metas !== false) {
            return res.end(cached_content);
          }
          if ('writeStream' in storage) {
            storage.writeStream(content_key, function(err, write_stream) {
              if (err) throw err;
              onCachedContentRetrieved(cached_metas, cached_content, write_stream);
            });
          }
          else {
            onCachedContentRetrieved(cached_metas, cached_content);
          }
        });
      }
    });
  }
};
