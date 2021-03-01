const _ = require('underscore');

const Table = require('markdown-table');
const Base = require('./base');
const ChartJsImage = require('chartjs-to-image');
const Time = require('./../models/time');

const format = {
    headline: h => `\n## ${h}\n`,
    warning: w => `${w}`
};

/**
 * stdout table output
 */
class markdown extends Base {
    constructor(config, report) {
        let newConfig = Object.assign({}, config);
        newConfig.toHumanReadable = function (input) {
            return Math.round(input / 60 / 60 * 100 ) / 100; 
        }
        super(newConfig, report);
        this.format = format;
    }

    getProjectLink (){
        let statsValues = Object.values(this.stats);
        let minBarLength = statsValues.reduce(function(a, b) {return Math.max(a, b);}) + 3;
        const projectStats = new ChartJsImage();
        projectStats.setConfig({
            type: 'bar',  
            data: { 
                labels: ['total estimate', 'total spent', 'spent'], 
                datasets: [
                    { label: '[h]', data: [this.stats['total estimate'], this.stats['total spent'], this.stats['spent']], minBarLength : minBarLength},
                ]
            },
            "options": {
                "responsive": true,
                "legend": {
                  "position": "top"
                },
                "title": {
                  "display": true,
                  "text": "Project"
                }
              }
        });

        return projectStats.getUrl()
    }

    getMemeberLink() {
        const memberStats = new ChartJsImage();
        memberStats.setConfig({
            type: 'bar',  
            data: { 
                labels: Object.keys(this.users), 
                datasets: [
                    { label: '[h]', data: Object.values(this.users)},
                ]
            },
            "options": {
                "responsive": true,
                "legend": {
                  "position": "top"
                },
                "title": {
                  "display": true,
                  "text": "Members"
                }
              }
        });

        return memberStats.getUrl();
    }

    makeStats() {}

    makeIssues() {
        this.headline('ISSUES');

        if (this.report.issues.length === 0)
            return this.warning('No issues found');

        let issues = [this.config.get('issueColumns').map(c => c.replace('_', ' '))];
        this.report.issues.forEach(issue => issues.push(this.prepare(issue, this.config.get('issueColumns'))));

        this.write(Table(issues));
    }

    makeMergeRequests() {
        this.headline('MERGE REQUESTS');

        if (this.report.mergeRequests.length === 0)
            return this.warning('No merge requests found');

        let mergeRequests = [this.config.get('mergeRequestColumns').map(c => c.replace('_', ' '))];
        this.report.mergeRequests.forEach(mergeRequest => mergeRequests.push(this.prepare(mergeRequest, this.config.get('mergeRequestColumns'))));

        this.write(Table(mergeRequests));
    }

    makeRecords() {
        this.headline('TIME RECORDS');

        let times = [this.config.get('recordColumns').map(c => c.replace('_', ' '))];
        this.times.forEach(time => times.push(this.prepare(time, this.config.get('recordColumns'))));

        this.write(Table(times));
    }
}

module.exports = markdown;