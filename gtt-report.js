const _ = require('underscore');
const fs = require('fs');
const program = require('commander');

const Cli = require('./include/cli');
const Config = require('./include/file-config');
const Report = require('./models/report');

const Output = {
    table: require('./output/table'),
    csv: require('./output/csv')
};

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
    .option('-r --report <report>', 'include in the report: stats, issues, merge_requests, records', collect, null)
    .option('-o --output <output>', 'use the given output', collect, null)
    .option('-l --file <file>', 'save report to the given file')
    .option('--include_by_labels <labels>', 'only include issues that have the given labels', collect, null)
    .option('--exclude_by_labels <labels>', 'exclude issues that have the given labels', collect, null)
    .option('--include_labels <labels>', 'only include the given labels in the report', collect, null)
    .option('--exclude_labels <labels>', 'exclude the given labels in the report', collect, null)
    .option('--date_format <date>', 'use the given date format in the report', collect, null)
    .option('--time_format <time>', 'use the given time format in the report')
    .option('--no_headlines', 'hide headlines in the report')
    .option('--no_warnings', 'hide warnings in the report')
    .option('--record_columns <columns>', 'include the given columns in the record part of the report', collect, null)
    .option('--issue_columns <columns>', 'include the given columns in the issue part of the report', collect, null)
    .option('--merge_request_columns <columns>', 'include the given columns in the merge request part of the report', collect, null)
    .option('--user_columns', 'include user columns in the report')
    .option('--quiet', 'only output report')
    .parse(process.argv);

// init helpers
let config = new Config(process.cwd());
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
    .set('includeByLabels', program.include_by_labels)
    .set('excludeByLabels', program.exclude_by_labels)
    .set('includeLabels', program.include_labels)
    .set('excludeLabels', program.exclude_labels)
    .set('dateFormat', program.date_format)
    .set('timeFormat', program.time_format)
    .set('output', program.output)
    .set('file', program.file)
    .set('query', program.query)
    .set('report', program.report)
    .set('recordColumns', program.record_columns)
    .set('issueColumns', program.issue_columns)
    .set('mergeRequestColumns', program.merge_request_columns)
    .set('noHeadlines', program.no_headlines)
    .set('noWarnings', program.no_warnings)
    .set('quiet', program.quiet)
    .set('userColumns', program.user_columns);

Cli.quiet = config.get('quiet');

// warnings
if (config.get('iids').length > 1 && config.get('query').length > 1) {
    Cli.warn(`The ids argument is ignored when querying multiple data types`);
}
if ((config.get('report').includes('issues') && !config.get('query').includes('issues'))) {
    Cli.warn(`Issues are included in the report but not queried.`);
}
if ((config.get('report').includes('merge_requests') && !config.get('query').includes('merge_requests'))) {
    Cli.warn(`Merge Requests are included in the report but not queried.`);
}
if (!Output[config.get('output')]) {
    Cli.error(`The output ${config.get('output')} doesn't exist`);
}

// create report
let report = new Report(config), output;

// file prompt
new Promise(resolve => {
    if (config.get('file') && fs.existsSync(config.get('file'))) {
        Cli.ask(`The file "${config.get('file')}" already exists. Overwrite?`)
            .then(() => resolve())
            .catch(error => Cli.error(`can't write file.`, error));
    } else {
        resolve();
    }
})

// get project
    .then(() => {
        Cli.list(`${Cli.look}  Resolving project "${config.get('project')}"`);
        return report.getProject();
    })

    // get members
    .then(() => new Promise((resolve, reject) => {
        if (!config.get('userColumns')) return resolve();

        report.project.members()
            .then(() => {
                let columns = report.project.users.map(user => `time_${user}`);

                config.set('issueColumns', _.uniq(config.get('issueColumns').concat(columns)));
                config.set('mergeRequestColumns', _.uniq(config.get('mergeRequestColumns').concat(columns)));
                resolve();
            })
            .catch(error => reject(error));
    }))
    .then(() => Cli.mark())
    .catch(error => Cli.x(`could not fetch project.`, error))

    // get issues
    .then(() => new Promise(resolve => {
        if (!config.get('query').includes('issues')) return resolve();

        Cli.list(`${Cli.fetch}  Fetching issues`);
        report.getIssues()
            .then(() => Cli.mark())
            .catch(error => Cli.x(`could not fetch issues.`, error))
            .then(() => resolve());
    }))

    // get merge requests
    .then(() => new Promise(resolve => {
        if (!config.get('query').includes('merge_requests')) return resolve();

        Cli.list(`${Cli.fetch}  Fetching merge requests`);
        report.getMergeRequests()
            .then(() => Cli.mark())
            .catch(error => Cli.x(`could not fetch merge requests.`, error))
            .then(() => resolve());
    }))

    // process issues
    .then(() => new Promise(resolve => {
        if (!config.get('query').includes('issues') || report.issues.length === 0) return resolve();

        Cli.bar(`${Cli.process}️  Processing issues`, report.issues.length);
        report.processIssues(() => Cli.advance())
            .then(() => Cli.mark())
            .catch(error => Cli.x(`could not process issues.`, error))
            .then(() => resolve());
    }))

    // process merge requests
    .then(() => new Promise(resolve => {
        if (!config.get('query').includes('merge_requests') || report.mergeRequests.length === 0) return resolve();

        Cli.bar(`${Cli.process}️️  Processing merge requests`, report.mergeRequests.length);
        report.processMergeRequests(() => Cli.advance())
            .then(() => Cli.mark())
            .catch(error => Cli.x(`could not process merge requests.`, error))
            .then(() => resolve());
    }))

    // make report
    .then(() => new Promise(resolve => {
        if (report.issues.length === 0 && report.mergeRequests.length === 0) Cli.error('No issues or merge requests matched your criteria.');
        Cli.list(`${Cli.output}  Making report`);

        output = new Output[config.get('output')](config, report);
        output.make();
        Cli.mark();
        resolve();
    }))
    .catch(error => Cli.x(`could not make report.`, error))

    // print report
    .then(() => new Promise(resolve => {
        if (config.get('file')) {
            output.toFile(config.get('file'));
        } else {
            output.toStdOut();
        }
        resolve();
    }))
    .catch(error => Cli.x(`could not print report.`, error))

    // time for a beer
    .then(() => Cli.done());