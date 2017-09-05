const program = require('commander');

const Config = require('./include/file-config');
const Cli = require('./include/cli');
const Fs = require('./include/filesystem');

program
    .arguments('[id]')
    .parse(process.argv);

let config = new Config(process.cwd());
let id = program.args[0];

if (
    (!id || !Fs.exists(Fs.join(config.frameDir, id + '.json')))
    && -Infinity === (id = Fs.newest(config.frameDir))
)
    Cli.error('No record found.');

Fs.open(Fs.join(config.frameDir, id.replace('.json', '') + '.json'));