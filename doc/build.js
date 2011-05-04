var fs = require('fs')
  , path = require('path')
  , markdown = require('markdown')
  , build_path = './doc/build/'
  , src_path = './doc/src/';

function generate(file) {
  var layout = fs.readFileSync(src_path + 'layout.html')
    , out = markdown.parse(fs.readFileSync(src_path + file + '.md').toString());
  out = layout.toString()
    .replace(/\{\{content\}\}/, out)
    .replace(/\{\{title\}\}/, file)
    .replace(/\{\{version\}\}/, version);
  fs.writeFileSync(build_path + file + '.html', out);
}

process.argv.shift();
process.argv.shift();
var version = process.argv.shift()
  , file;
fs.writeFile(build_path + 'current', version);
build_path += version + '/';
if (!path.existsSync(build_path)) {
  fs.mkdirSync(build_path, 0755);
  process.stdout.write(build_path + ' created\n');
}
while (file = process.argv.shift()) {
  generate(file);
}
