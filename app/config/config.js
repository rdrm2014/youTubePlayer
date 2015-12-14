var nconf = require('nconf');
var src = process.cwd() + '/app/';

console.log(src);
nconf.file({
    file: src + 'config/config.json'
});

/*nconf.argv()
  //  .env()
    .file({
        file: src + 'config/config.json'
    });*/

module.exports = nconf;