Connect-cache
=============

Connect-cache is a middleware for Connect framework. It provides a easy way to
cache GET requests on your application.

Usage
-----

    var ConnectCache = require('connect-cache');
    var server = Connect.createServer(
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
- `get` : get content for the given key. Parameters are `key` and `callback`.
- `set` : set content for the given key. Parameters are `key`, `content` and `callback`.
- `remove` : invalidate datas for the given key. Parameters are `key` and `callback`. 