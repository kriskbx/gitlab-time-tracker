const program = require('commander');
const colors = require('colors');
const moment = require('moment');

const Config = require('./include/file-config');
const Cli = require('./include/cli');
const Tasks = require('./include/tasks');

program
    .option('--verbose', 'show verbose output')
    .parse(process.argv);

Cli.verbose = program.verbose;

let config = new Config(process.cwd());
let tasks = new Tasks(config);

tasks.cancel()
    .then(frames => {
        frames.forEach(frame => console.log(`Cancel project ${frame.project.magenta} ${frame.resource.type.blue} ${('#' + frame.resource.id).blue}, started ${moment(frame.start).fromNow().green}`))
    })
    .catch(error => Cli.error(error));