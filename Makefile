VERSION=$(shell git describe --tags)
test_files = test/*.test.js
couchdb_test_files = test/couchdb/*.test.js
doc_files = index

test: clean
	expresso $(test_files)

test-couchdb: clean
	expresso $(couchdb_test_files)

test-all: clean
	expresso $(test_files) $(couchdb_test_files)

clean:
	rm -rf cache/*

doc-clean:
	rm -rf doc/build/$(VERSION)/*.html

doc: doc-clean
	node doc/build.js $(VERSION) $(doc_files)
