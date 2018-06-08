const moment = require('moment');
const program = require('commander');

const Config = require('./include/file-config');
const Cli = require('./include/cli');
const Tasks = require('./include/tasks');
const Owner = require('./models/owner');

program
    .option('-p --proxy <proxy>', 'use a proxy server with the given url')
    .option('--verbose', 'show verbose output')
    .option('--check_token', 'check the access token')
    .parse(process.argv);

Cli.verbose = program.verbose;

let config = new Config(process.cwd())
        .set('proxy', program.proxy)
        .set('_checkToken', program.check_token),
    tasks = new Tasks(config),
    owner = new Owner(config);

tasks.syncInit()
    .then(() => tasks.sync.frames.length === 0 ? process.exit(0) : null)
    .then(() => owner.authorized())
    .catch(e => Cli.x(`Invalid access token!`, e))
    .then(() => {
        Cli.bar(`${Cli.fetch}  Fetching or creating issues & merge requests...`, tasks.sync.frames.length);
        return tasks.syncResolve(Cli.advance);
    })
    .then(() => {
        Cli.bar(`${Cli.process}  Processing issues & merge requests...`, tasks.sync.frames.length);
        return tasks.syncNotes(Cli.advance);
    })
    .then(() => {
        Cli.bar(`${Cli.update}  Syncing time records...`, tasks.sync.frames.length);
        return tasks.syncUpdate(Cli.advance)
    })
    .catch(error => Cli.x(error));