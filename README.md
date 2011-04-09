Connect-cache
=============

Connect-cache is a middleware for Connect framework. It provides a easy way to
cache GET requests on your application.

Usage
-----

    var connect_cache = require('connect-cache');
    var connect = require('connect');
    var server = connect.createServer(
      connect_cache({regex: /.*/}),
      function(req, res) {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('Hello World');
      }
    );

ConnectCache take only one parameter, a hash with following keys :

- `regex` : a regular expression that should match on url
- `ttl` (optional, default 3600000) : in ms, the time to live for cached datas
- `storage` (optional, default BasicStorage) : the key-value storage system,
   see Storage paragraph for more informations
- `storage_option` (optional, default {}) : options for storage system constructor

Storage
-------

The storage class must implements 3 methods :

- `get(key, callback)` : get content for the given key.
- `set(key, content, callback)` : set content for the given key.
- `remove(key, callback)` : invalidate datas for the given key. 