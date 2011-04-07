var fs = require('fs');

var cache_path = 'cache/';

function BasicStorage (options) {
  if ('cache_path' in options) {
    cache_path = options.cache_path;
  }
  fs.stat(cache_path, function (err, stats) {
    if (err) {
      console.error(err.message);
    }
    if (!stats || !stats.isDirectory()) {
      console.log('create directory : ' + cache_path);
      fs.mkdir(cache_path, 0664);
    }
  });
}

BasicStorage.prototype.get = function(key, cb) {
  fs.stat(cache_path + key, function (err, stats) {
    if (err) {
      console.error(err.message);
    }
    if (stats && stats.isFile()) {
      fs.readFile(cache_path + key, cb);
      return;
    }
    cb(null, false);
  });
};

BasicStorage.prototype.set = function(key, content, cb) {
  fs.writeFile(cache_path + key, content, 'binary', cb);
};

BasicStorage.prototype.remove = function(key, cb) {
  fs.stat(cache_path + key, function (err, stats) {
    if (err) {
      return console.error(err.message);
    }
    if (stats && stats.isFile()) {
      fs.unlink(cache_path + key, cb);
    }
  });
};

exports = module.exports = BasicStorage;