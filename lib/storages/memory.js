
var cache = {};

function MemoryStorage () { }

MemoryStorage.prototype.get = function(key, cb) {
  cb && cb(null, key in cache ? cache[key] : false);
};

MemoryStorage.prototype.set = function(key, content, cb) {
  cache[key] = content;
  cb && cb(null);
};

MemoryStorage.prototype.remove = function(key, cb) {
  if (key in cache) {
    delete cache[key];
  }
  cb(null);
};

exports = module.exports = MemoryStorage;