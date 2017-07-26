const moment = require('moment');
const program = require('commander');

const Config = require('./include/file-config');
const Cli = require('./include/cli');
const Tasks = require('./include/tasks');

program
    .option('-p --proxy <proxy>', 'use a proxy server with the given url')
    .option('--verbose', 'show verbose output')
    .parse(process.argv);

Cli.verbose = program.verbose;

let config = new Config(process.cwd()).set('proxy', program.proxy),
    tasks = new Tasks(config);

tasks.syncResolve()
    .then(() => {
        if (tasks.sync.frames.length === 0) process.exit(0);
        return Cli.bar(`${Cli.process}  Syncing time records...`, tasks.sync.frames.length)
    })
    .then(() => tasks.syncNotes())
    .then(() => tasks.syncUpdate(Cli.advance))
    .catch(error => Cli.x(error));