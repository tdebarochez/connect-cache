Connect-cache
=============

Connect-cache is a middleware for Connect framework. It provides a easy way to
cache GET requests on your application.

Usage
-----

This middleware must be on the first called.

    var connect_cache = require('connect-cache');
    var connect = require('connect');
    var server = connect.createServer(
      connect_cache({rules: [{regex: /.*/, ttl: 60000}]}),
      function(req, res) {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('Hello World');
      }
    ).listen(3000);

ConnectCache take only one parameter, a hash with following keys :

- `rules` : a set regular expression / ttl pairs, that should match on urls
- `loopback` (optional, default parse "Host" header in request) : host and port to call
   to get contents, ex : 'localhost:3000'
- `storage` (optional, default instance of BasicStorage) : the key-value storage system,
   see Storage paragraph for more informations
- `sensitive` (optional, default true) : caching datas are based on URL and sometimes
   URLs must be treated case insensitive. This option is here to avoid duplicate
   caches.

Rules must looks like :

  {rules: [{regex: /path\/.*/, ttl: 60000},
           {regex: /other\/path\/.*/, ttl: 3600000},
           {regex: /specified.file/, ttl: 6000000}]}

Default TTL is in ms, default value is 3600000.

Storage
-------

This package provide three bundled ways (a basic based file system, a basic memory and
a wrapper for couchdb) to store your items, but you can define your own one. The storage
class must implements 3 methods :

- `get(key, callback)` : get content for the given key.
- `set(key, content, callback)` : set content for the given key.
- `remove(key, callback)` : invalidate datas for the given key. 
- `writeStream(key, callback)` : (optional) used to write cached content as
   stream
- `readStream(key, callback)` : (optional) used to read cached datas as stream

Look at `examples/` folder for examples of bundled storage system.

Installation
------------

    $ npm install connect-cache

How it works
------------

This module catch every request that match on a regular expression and call, if the
result is not cached, himself with extra HTTP header : x-no-cache. The results is 
store and forward to final client.

Requirements
------------

- node (>= 0.4.6)
- connect (>= 0.2.4)
- express & expresso - for tests
- cradle (= 0.1.0) - for CouchDB storage system
