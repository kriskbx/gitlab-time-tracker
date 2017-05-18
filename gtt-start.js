const colors = require('colors');
const moment = require('moment');
const program = require('commander');

const Frame = require('./models/frame');
const Config = require('./include/file-config');
const Cli = require('./include/cli');
const Fs = require('./include/filesystem');

program
    .arguments('[project] [id]')
    .option('-t, --type <type>', 'specify resource type: issue, merge_request')
    .parse(process.argv);

let config = new Config(process.cwd());

if (program.args.length < 2 && !config.get('project')) Cli.error('No project set');
if (program.args.length === 2) config.set('project', program.args[0]);

let id = program.args.length === 1 ? parseInt(program.args[0]) : parseInt(program.args[1]);
if (!id) Cli.error('Wrong or missing issue/merge_request id');

let type = program.type ? program.type : 'issue';

Fs.find(`"stop": false`, config.frameDir)
    .then(frames => {
        if (frames.length > 0) Cli.error("Already running. Please stop it first with 'gtt stop'.");

        new Frame(config, id, type).startMe();
        console.log(`Starting project ${config.get('project').magenta} ${type.blue} ${('#' + id).blue} at ${moment().format('HH:mm').green}`);
    })
    .catch(error => Cli.error('Could not write frame.', error));