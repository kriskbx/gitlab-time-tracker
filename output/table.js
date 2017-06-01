const _ = require('underscore');
const Table = require('cli-table');
const Base = require('./base');
const Color = require('colors');

const format = {
    headline: h => `\n${h.bold.underline}\n`,
    warning: w => w.yellow
};

/**
 * stdout table output
 */
class table extends Base {
    constructor(config, report) {
        super(config, report);
        this.format = format;
    }

    makeStats() {
        this.headline('TIME STATS');

        let stats = '';

        _.each(this.stats, (time, name) => stats += `\n* ${name.red}: ${time}`);
        _.each(this.users, (time, name) => stats += `\n* ${name.red}: ${time}`);

        this.write(stats.substr(1));
    }

    makeIssues() {
        this.headline('ISSUES');

        if (this.report.issues.length === 0)
            return this.warning('No issues found');

        let issues = new Table({head: this.config.get('issueColumns').map(c => c.replace('_', ' '))});
        this.report.issues.forEach(issue => issues.push(this.prepare(issue, this.config.get('issueColumns'))));
        this.write(issues.toString());
    }

    makeMergeRequests() {
        this.headline('MERGE REQUESTS');

        if (this.report.mergeRequests.length === 0)
            return this.warning('No merge requests found');

        let mergeRequests = new Table({head: this.config.get('mergeRequestColumns').map(c => c.replace('_', ' '))});
        this.report.mergeRequests.forEach(mergeRequest => mergeRequests.push(this.prepare(mergeRequest, this.config.get('mergeRequestColumns'))));
        this.write(mergeRequests.toString());
    }

    makeRecords() {
        this.headline('TIME RECORDS');
        let times = new Table({head: this.config.get('recordColumns').map(c => c.replace('_', ' '))});
        this.times.forEach(time => times.push(this.prepare(time, this.config.get('recordColumns'))));
        this.write(times.toString());
    }
}

module.exports = table;