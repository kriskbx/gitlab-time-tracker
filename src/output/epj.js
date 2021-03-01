const _ = require('underscore');

const Table = require('markdown-table');
const Base = require('./base');
const Chart = require('./charts')

/**
 * stdout table output
 */
class epj extends Base {
    constructor(config, report) {
        super(config, report);
        this.format = {
            headline: h => `\n## ${h}\n`,
            warning: w => `${w}`
        };
        this.chart = new Chart(config, report);
        this.write(`# Time Report`)
        this.write(`Autogenerated with CI/CD and gtt.`)
        
    }

    makeStats() {
        this.headline('Project');

        let stats = '';

        _.each(this.stats, (time, name) => stats += `\n* **${name}**: ${time}`);
        stats += "\n\n![alt Project summary](" + this.chart.getProjectLink() + ' "Project summary")\n' 

        stats += `\n## Members\n`;

        if (this.projects.length > 1) {
            _.each(this.projects, (time, name) => stats += `\n* **${name.red}**: ${time}`);
            stats += `\n`;
        }

        _.each(this.users, (time, name) => stats += `\n* **${name}**: ${time}`);

        stats += `\n`;
        stats += "\n\n![alt Memebrs](" + this.chart.getMemeberLink() + ' "Members")\n\n'

        this.write(stats.substr(1));
    }

    makeIssues() {
        this.headline('Issues');

        if (this.report.issues.length === 0)
            return this.warning('No issues found');

        let issues = [this.config.get('issueColumns').map(c => c.replace('_', ' '))];
        this.report.issues.forEach(issue => issues.push(this.prepare(issue, this.config.get('issueColumns'))));

        this.write(Table(issues));
    }

    makeMergeRequests() {
        this.headline('Merge request');

        if (this.report.mergeRequests.length === 0)
            return this.warning('No merge requests found');

        let mergeRequests = [this.config.get('mergeRequestColumns').map(c => c.replace('_', ' '))];
        this.report.mergeRequests.forEach(mergeRequest => mergeRequests.push(this.prepare(mergeRequest, this.config.get('mergeRequestColumns'))));

        this.write(Table(mergeRequests));
    }

    makeRecords() {
        this.headline('Time records');

        let times = [this.config.get('recordColumns').map(c => c.replace('_', ' '))];
        this.times.forEach(time => times.push(this.prepare(time, this.config.get('recordColumns'))));

        this.write(Table(times));
    }
}

module.exports = epj;