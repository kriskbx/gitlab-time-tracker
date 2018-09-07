const _ = require('underscore');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const Base = require('./base');
const Cli = require('./../include/cli');

/**
 * xlsx output
 */
class xlsx extends Base {

    makeStats() {
        let stats = [[], []];

        _.each(this.stats, (time, name) => {
            stats[0].push(name);
            stats[1].push(time);
        });

        if (this.projects.length > 1) {
            _.each(this.projects, (time, name) => {
                stats[0].push(name);
                stats[1].push(time);
            });
        }

        _.each(this.users, (time, name) => {
            stats[0].push(name);
            stats[1].push(time);
        });

        this.xlsxStats = XLSX.utils.aoa_to_sheet(stats);
    }

    makeIssues() {
        let issues = [];
        issues.push(this.config.get('issueColumns'));
        this.report.issues.forEach(issue => issues.push(this.prepare(issue, this.config.get('issueColumns'))));

        this.xlsxIssues = XLSX.utils.aoa_to_sheet(issues);
    }

    makeMergeRequests() {
        let mergeRequests = [];
        mergeRequests.push(this.config.get('mergeRequestColumns'));
        this.report.mergeRequests.forEach(mergeRequest => mergeRequests.push(this.prepare(mergeRequest, this.config.get('mergeRequestColumns'))));

        this.xlsxMergeRequests = XLSX.utils.aoa_to_sheet(mergeRequests);
    }

    makeRecords() {
        let times = [];
        times.push(this.config.get('recordColumns'));
        this.times.forEach(time => times.push(this.prepare(time, this.config.get('recordColumns'))));

        this.xlsxRecords = XLSX.utils.aoa_to_sheet(times);
    }

    toFile(file, resolve) {
        let fileName = path.basename(file);
        let extName = path.extname(file);
        let workbook = XLSX.utils.book_new();

        if (this.config.get('report').includes('stats')) {
            XLSX.utils.book_append_sheet(workbook, this.xlsxStats, 'Stats');
        }

        if (this.config.get('report').includes('issues')) {
            XLSX.utils.book_append_sheet(workbook, this.xlsxIssues, 'Issues');
        }

        if (this.config.get('report').includes('merge_requests')) {
            XLSX.utils.book_append_sheet(workbook, this.xlsxMergeRequests, 'Merge Requests');
        }

        if (this.config.get('report').includes('records')) {
            XLSX.utils.book_append_sheet(workbook, this.xlsxRecords, 'Records');
        }

        XLSX.writeFile(workbook, fileName + extName);

        resolve();
    }

    toStdOut() {
        Cli.error(`Can't output xlsx to std out`);
    }
}

module.exports = xlsx;
