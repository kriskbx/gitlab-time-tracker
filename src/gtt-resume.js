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

let config = new Config(process.cwd()),
  tasks = new Tasks(config);


tasks.resume()
    .then(frame => console.log(`Starting project ${config.get('project').magenta} ${frame.resource.type.blue} ${('#' + frame.resource.id).blue} at ${moment().format('HH:mm').green}`))
    .catch(error => Cli.error(error));
