const _ = require('underscore');
const Csv = require('csv-string');

const Base = require('./base');

/**
 * csv output
 */
class csv extends Base {
    makeStats() {
        let stats = [[], []];

        _.each(this.stats, (time, name) => {
            stats[0].push(name);
            stats[1].push(time);
        });
        _.each(this.users, (time, name) => {
            stats[0].push(name);
            stats[1].push(time);
        });

        this.csvStats = Csv.stringify(stats);
    }

    makeIssues() {
        let issues = [];
        issues.push(this.config.get('issueColumns'));
        this.report.issues.forEach(issue => issues.push(this.prepare(issue, this.config.get('issueColumns'))));
        this.csvIssues = Csv.stringify(issues);
    }

    makeMergeRequests() {
        let mergeRequests = [];
        mergeRequests.push(this.config.get('mergeRequestColumns'));
        this.report.mergeRequests.forEach(mergeRequest => mergeRequests.push(this.prepare(mergeRequest, this.config.get('mergeRequestColumns'))));
        this.csvMergeRequests = Csv.stringify(mergeRequests);
    }

    makeRecords() {
        let times = [];
        times.push(this.config.get('recordColumns'));
        this.times.forEach(time => times.push(this.prepare(time, this.config.get('recordColumns'))));
        this.csvRecords = Csv.stringify(times);
    }

    toStdOut() {
        this.headline('STATS');
        this.write(this.csvStats);
        this.headline('ISSUES');
        this.write(this.csvIssues);
        this.headline('MERGE REQUESTS');
        this.write(this.csvMergeRequests);
        this.headline('TIME RECORDS');
        this.write(this.csvRecords);

        super.toStdOut();
    }
}

module.exports = csv;