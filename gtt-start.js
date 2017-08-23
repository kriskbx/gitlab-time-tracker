const colors = require('colors');
const moment = require('moment');
const program = require('commander');

const Config = require('./include/file-config');
const Cli = require('./include/cli');
const Tasks = require('./include/tasks');

program
    .arguments('[project] [id]')
    .option('-t, --type <type>', 'specify resource type: issue, merge_request')
    .option('--verbose', 'show verbose output')
    .parse(process.argv);

Cli.verbose = program.verbose;

let config = new Config(process.cwd()),
    tasks = new Tasks(config),
    type = program.type ? program.type : 'issue',
    id = program.args.length === 1 ? parseInt(program.args[0]) : parseInt(program.args[1]),
    project = program.args.length === 2 ? program.args[0] : null;

if (program.args.length < 2 && !config.get('project'))
    Cli.error('No project set');

if (!id)
    Cli.error('Wrong or missing issue/merge_request id');

tasks.start(project, type, id)
    .then(frame => console.log(`Starting project ${config.get('project').magenta} ${type.blue} ${('#' + id).blue} at ${moment().format('HH:mm').green}`))
    .catch(error => Cli.error(error));