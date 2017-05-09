const program = require('commander');

const open = require('open');
const Config = require('./include/file-config');

let config = new Config(__dirname);

program
    .option('-l, --local', 'edit the local configuration file')
    .parse(process.argv);

if (program.local) {
    config.assertLocalConfig();
}

open(program.local ? config.local : config.global);