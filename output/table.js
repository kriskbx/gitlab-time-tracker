const _ = require('underscore');
const Table = require('cli-table');
const Base = require('./base');
const Color = require('colors');

const format = {
    headline: h => `\n\n${h.bold.underline}\n\n`,
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

        let first = true;

        _.each(this.stats, (time, name) => {
            if (first) {
                first = false;
            } else {
                this.write('\n');
            }

            this.write(`* ${name.red}: ${time}`)
        });
        _.each(this.users, (time, name) => this.write(`\n* ${name.red}: ${time}`));
    }

    makeIssues() {
        this.headline('ISSUES');

        if (this.report.issues.length === 0)
            return this.warning('No issues found');

        let issues = new Table({head: this.config.get('issueColumns')});
        this.report.issues.forEach(issue => issues.push(this.prepare(issue, this.config.get('issueColumns'))));
        this.write(issues.toString());
    }

    makeMergeRequests() {
        this.headline('MERGE REQUESTS');

        if (this.report.mergeRequests.length === 0)
            return this.warning('No merge requests found');

        let mergeRequests = new Table({head: this.config.get('mergeRequestColumns')});
        this.report.mergeRequests.forEach(mergeRequest => mergeRequests.push(this.prepare(mergeRequest, this.config.get('mergeRequestColumns'))));
        this.write(mergeRequests.toString());
    }

    makeRecords() {
        this.headline('TIME RECORDS');
        let times = new Table({head: this.config.get('recordColumns')});
        this.times.forEach(time => times.push(this.prepare(time, this.config.get('recordColumns'))));
        this.write(times.toString());
    }
}

module.exports = table;