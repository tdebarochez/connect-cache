test_files = test/*.test.js
couchdb_test_files = test/couchdb/*.test.js

test: clean
	expresso $(test_files)

test-couchdb: clean
	expresso $(couchdb_test_files)

test-all: clean
	expresso $(test_files) $(couchdb_test_files)

clean:
	rm -rf cache/
	mkdir cache