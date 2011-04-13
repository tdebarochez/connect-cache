var storage = new (require('../lib/basic-storage'))
  , utils = require('connect').utils
  , fs = require('fs')
  , assert = require('assert');

var keys = {utf8: utils.md5('/blah?sd[]=4&t=' + (+new Date)),
            binary: utils.md5('/blah/pix.png?' + (+new Date))}
  , values = {utf8 : new Buffer('àéè', 'utf8'),
              binary: fs.readFileSync('./static/test.jpg')};

module.exports = {};
['binary', 'utf8'].forEach(function (type) {
  module.exports['set & get ' + type] = function () {
    storage.set(keys[type], values[type], function (err) {
      assert.strictEqual(err, null);
      storage.get(keys[type], function (err, content) {
        assert.strictEqual(err, null);
        assert.strictEqual(utils.md5(content), utils.md5(values[type]));         
        storage.remove(keys[type], function (err) {
          assert.strictEqual(err, null);
          storage.get(keys[type], function (err, content) {
            assert.strictEqual(err, null);
            assert.strictEqual(content, false);
          });
        });
      });
    });
  };
  module.exports['readStream & writeStream ' + type] = function () {
    storage.writeStream('s' + keys[type], function (err, write_stream) {
      assert.strictEqual(err, null);
      write_stream.write(values[type]);
      write_stream.end();
      storage.get('s' + keys[type], function (err, content) {
        assert.strictEqual(err, null);
        assert.strictEqual(utils.md5(content), utils.md5(values[type]));
        storage.readStream('s' + keys[type], function (err, read_stream) {
          assert.strictEqual(err, null);
          storage.writeStream('s' + keys[type], function (err, write_stream) {
            assert.strictEqual(err, null);
            read_stream.pipe(write_stream);
            storage.get('s' + keys[type], function (err, content) {
              assert.strictEqual(err, null);
              assert.strictEqual(utils.md5(content), utils.md5(values[type]));
              storage.remove('s' + keys[type]);
            });
          });
        });
      });
    });
  }
});