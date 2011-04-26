var cradle = require('cradle');

function _check_error(err) {
  if (err === null) {
    return;
  }
  console.log(err);
  console.log(new Error().stack);
}

function _uri_encode(id) {
  return encodeURIComponent(decodeURIComponent(id));
}

function CouchDBStorage (database, opts) {
  opts = opts || {};
  if (!database) {
    throw "You must define a database";
  }

  // We never ever want caching.
  opts.cache = false;

  db = new(cradle.Connection)(opts).database(database);
  db.exists(function (err) {
    if (err) {
      console.log(err);
    }
  });
}

CouchDBStorage.prototype.get = function(key, cb) {
  db.get(_uri_encode(key), function (err, doc) {
    if (err) {
      return cb(null, false);
    }
    return cb(null, new Buffer(doc.datas));
  });
};

CouchDBStorage.prototype.set = function(key, content, cb) {
  key = _uri_encode(key);
  cb = cb || function () {};
  db.get(key, function (err, doc) {
    if (!doc) {
      db.save(key, {datas: content}, function(err, res) {
        cb(err, res);
      });
    }
    else {
      db.save(key, doc._rev, {datas: content}, function(err, res) {
        cb(err, res);
      });
    }
  });
};

CouchDBStorage.prototype.remove = function(key, cb) {
  db.get(_uri_encode(key), function (err, doc) {
    if (!err) {
      db.remove(_uri_encode(key), doc._rev, cb);
    }
  });
};


exports = module.exports = CouchDBStorage;