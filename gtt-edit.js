const program = require('commander');

const open = require('open');
const Config = require('./include/file-config');

let config = new Config(__dirname);

program
    .command('gtt edit')
    .option('-l, --local', 'edit the local configuration file', false)
    .parse(process.argv);

open(program.local ? config.local : config.global) ;