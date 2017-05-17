const _ = require('underscore');
const fs = require('fs');
const path = require('path');
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

    toFile(file) {
        let fileName = path.basename(file);
        let extName = path.extname(file);

        if (this.config.get('report').includes('stats')) {
            fs.writeFileSync(file.replace(fileName, fileName.replace(extName, `.stats${extName}`)), this.csvStats);
        }

        if (this.config.get('report').includes('issues')) {
            fs.writeFileSync(file.replace(fileName, fileName.replace(extName, `.issues${extName}`)), this.csvIssues);
        }

        if (this.config.get('report').includes('merge_requests')) {
            fs.writeFileSync(file.replace(fileName, fileName.replace(extName, `.mergeRequests${extName}`)), this.csvMergeRequests);
        }

        if (this.config.get('report').includes('records')) {
            fs.writeFileSync(file.replace(fileName, fileName.replace(extName, `.records${extName}`)), this.csvRecords);
        }
    }

    toStdOut() {
        if (this.config.get('report').includes('state')) {
            this.headline('STATS');
            this.write(this.csvStats);
        }

        if (this.config.get('report').includes('issues')) {
            this.headline('ISSUES');
            this.write(this.csvIssues);
        }

        if (this.config.get('report').includes('merge_requests')) {
            this.headline('MERGE REQUESTS');
            this.write(this.csvMergeRequests);
        }

        if (this.config.get('report').includes('records')) {
            this.headline('TIME RECORDS');
            this.write(this.csvRecords);
        }

        super.toStdOut();
    }
}

module.exports = csv;