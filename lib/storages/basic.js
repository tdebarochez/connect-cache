var fs = require('fs');

var cache_path = 'cache/';

function BasicStorage (options) {
  options = options || {};
  if ('cache_path' in options) {
    cache_path = options.cache_path;
  }
  fs.stat(cache_path, function (err, stats) {
    if (err) {
      console.info(err.message);
    }
    if (!stats || !stats.isDirectory()) {
      console.log('create directory : ' + cache_path);
      fs.mkdir(cache_path, 0755);
    }
  });
}

BasicStorage.prototype.get = function(key, cb) {
  if (!isValidKey(key)) {
    throw new Error('invalid key : ' + key);
  }
  cb = cb || function () {};
  fs.stat(cache_path + key, function (err, stats) {
    if (stats && stats.isFile()) {
      return fs.readFile(cache_path + key, cb);
    }
    cb(null, false);
  });
};

BasicStorage.prototype.readStream = function (key, cb) {
  if (!isValidKey(key)) {
    throw new Error('invalid key');
  }
  cb = cb || function () {};
  fs.stat(cache_path + key, function (err, stats) {
    if (!stats || !stats.isFile()) {
      return cb(null, false);
    }
    var opts = {flags: 'r',
                mode: 0664};
    var handle = fs.createReadStream(cache_path + key, opts);
    handle.on('open', function () {
      cb(null, handle);
    });
    handle.on('error', function (err) {
      cb(err, false);
    });
  });
};

BasicStorage.prototype.set = function(key, content, cb) {
  if (!isValidKey(key)) {
    throw new Error('invalid key');
  }
  fs.writeFile(cache_path + key, content, cb);
};

BasicStorage.prototype.writeStream = function (key, cb) {
  if (!isValidKey(key)) {
    throw new Error('invalid key');
  }
  cb = cb || function () {};
  var opts = {flags: 'w',
              mode: 0664};
  var handle = fs.createWriteStream(cache_path + key, opts);
  handle.on('error', function (err) {
    cb(err);
  });
  handle.on('open', function () {
    cb(null, handle);
  });
};

BasicStorage.prototype.remove = function(key, cb) {
  if (!isValidKey(key)) {
    throw new Error('invalid key');
  }
  cb = cb || function () {};
  fs.stat(cache_path + key, function (err, stats) {
    if (err) {
      return cb(err);
    }
    if (stats && stats.isFile()) {
      fs.unlink(cache_path + key, cb);
    }
  });
};

function isValidKey(key) {
  return typeof key == 'string' && /^[a-z0-9]+$/.test(key.toLowerCase());
}

exports = module.exports = BasicStorage;