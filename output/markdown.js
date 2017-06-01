const _ = require('underscore');

const Table = require('markdown-table');
const Base = require('./base');

const format = {
    headline: h => `\n### ${h}\n`,
    warning: w => `> ${w}`
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

        _.each(this.stats, (time, name) => stats += `\n* **${name}**: ${time}`);
        _.each(this.users, (time, name) => stats += `\n* **${name}**: ${time}`);

        this.write(stats.substr(1));
    }

    makeIssues() {
        this.headline('ISSUES');

        if (this.report.issues.length === 0)
            return this.warning('No issues found');

        let issues = [this.config.get('issueColumns')];
        this.report.issues.forEach(issue => issues.push(this.prepare(issue, this.config.get('issueColumns'))));

        this.write(Table(issues));
    }

    makeMergeRequests() {
        this.headline('MERGE REQUESTS');

        if (this.report.mergeRequests.length === 0)
            return this.warning('No merge requests found');

        let mergeRequests = [this.config.get('mergeRequestColumns')];
        this.report.mergeRequests.forEach(mergeRequest => mergeRequests.push(this.prepare(mergeRequest, this.config.get('mergeRequestColumns'))));

        this.write(Table(mergeRequests));
    }

    makeRecords() {
        this.headline('TIME RECORDS');

        let times = [this.config.get('recordColumns')];
        this.times.forEach(time => times.push(this.prepare(time, this.config.get('recordColumns'))));

        this.write(Table(times));
    }
}

module.exports = table;