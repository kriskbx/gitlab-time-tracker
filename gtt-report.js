const program = require('commander');

const Cli = require('./include/cli');
const Config = require('./include/file-config');
const Report = require('./model/report');

// this collects options
function collect(val, arr) {
    if (!arr) arr = [];
    arr.push(val);

    return _.uniq(arr);
}

// set options
program
    .arguments('[project] [ids]')
    .option('-f --from <from>', 'query times that are equal or greater than the given date')
    .option('-t --to <to>', 'query times that are equal or smaller than the given date')
    .option('-c --closed', 'include closed issues')
    .option('-u --user <user>', 'only query times from the given user')
    .option('-m --milestone <milestone>', 'include issues from the given milestone')
    .option('-q --query <query>', 'query the given data types: issues, merge_requests', collect, null)
    .option('-o --output <output>', 'use the given output', collect, null)
    .option('-l --file <file>', 'save report to the given file', collect, null)
    .option('--columns <columns>', 'include the given columns in the report', collect, null)
    .option('--include_by_labels <labels>', 'only include issues that have the given labels', collect, null)
    .option('--exclude_by_labels <labels>', 'exclude issues that have the given labels', collect, null)
    .option('--include_labels <labels>', 'only include the given labels in the report', collect, null)
    .option('--exclude_labels <labels>', 'exclude the given labels in the report', collect, null)
    .option('--date_format <date>', 'use the given date format in the report', collect, null)
    .option('--time_format <time>', 'use the given time format in the report', collect, null)
    .parse(process.argv);

// init helpers
let config = new Config(__dirname);
let cli = new Cli(program.args);

// overwrite config with args and opts
config
    .set('project', cli.project())
    .set('iids', cli.iids())
    .set('from', program.from)
    .set('to', program.to)
    .set('closed', program.closed)
    .set('user', program.user)
    .set('milestone', program.milestone)
    .set('columns', program.columns)
    .set('includeByLabels', program.include_by_labels)
    .set('excludeByLabels', program.exclude_by_labels)
    .set('includeLabels', program.include_labels)
    .set('excludeLabels', program.exclude_labels)
    .set('dateFormat', program.date_format)
    .set('timeFormat', program.time_format)
    .set('output', program.output)
    .set('file', program.file);

// warnings
if (config.get('iids').length > 1 && config.get('query').length > 1) {
    Cli.warn(`The ids argument is ignored when querying multiple data types`);
}

let report = new Report(config);

// get project
Cli.list(`🔍  Resolving project "${config.get('project')}"`);
report
    .project()
    .then(() => Cli.mark())
    .catch(error => Cli.x(`could not fetch project.`, error))

    // get issues
    .then(() => new Promise((resolve) => {
        if (!config.get('query').includes('issues')) return resolve();
        Cli.list(`📦  Fetching issues`);
        report.issues()
            .then(() => Cli.mark())
            .catch(error => Cli.x(`could not fetch issues.`, error))
            .then(() => resolve());
    }))

    // get merge requests
    .then(() => new Promise((resolve) => {
        if (!config.get('query').includes('merge_requests')) return resolve();
        Cli.list(`📦  Fetching merge requests`);
        report.mergeRequests()
            .then(() => Cli.mark())
            .catch(error => Cli.x(`could not fetch merge requests.`, error))
            .then(() => resolve());
    }))

    // process issues
    .then(() => new Promise((resolve) => {
        if (!config.get('query').includes('issues')) return resolve();
        Cli.bar(`⚙️  Processing issues`, report.issues.length);
        report.processIssues(() => Cli.advance())
            .then(() => Cli.mark())
            .catch(error => Cli.x(`could not process issues.`, error))
            .then(() => resolve());
    }))

    //process merge requests
    .then(() => new Promise((resolve) => {
        if (!config.get('query').includes('merge_requests')) return resolve();
        Cli.bar(`⚙️  Processing merge requests`, report.issues.length);
        report.processMergeRequests(() => Cli.advance())
            .then(() => Cli.mark())
            .catch(error => Cli.x(`could not process merge requests.`, error))
            .then(() => resolve());
    }))

    // time for a beer
    .then(() => Cli.done());