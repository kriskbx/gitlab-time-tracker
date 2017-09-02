const program = require('commander');

const Config = require('./include/file-config');
const Fs = require('./include/filesystem');

let config = new Config(process.cwd());

program
    .option('-l, --local', 'edit the local configuration file')
    .parse(process.argv);

if (program.local) {
    config.assertLocalConfig();
}

Fs.open(program.local ? config.local : config.global);