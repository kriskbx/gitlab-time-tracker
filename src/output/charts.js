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
class chart extends Base {
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

    makeIssues() {}

    makeMergeRequests() {}

    makeRecords() {}
}

module.exports = chart;