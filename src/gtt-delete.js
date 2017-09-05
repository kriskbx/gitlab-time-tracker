const program = require('commander');

const Frame = require('./models/frame');
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

let file = Fs.join(config.frameDir, id.replace('.json', '') + '.json');
let frame = Frame.fromFile(config, file).stopMe();
Fs.remove(file);
console.log(`Deleting record ${frame.id.magenta}`);