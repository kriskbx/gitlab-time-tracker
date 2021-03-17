const Base = require('./base');
const ChartJsImage = require('chartjs-to-image');
const _ = require('underscore')

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
            options: {
                responsive: true,
                legend: {
                  position: "top"
                },
                title: {
                  display: true,
                  text: "Project"
                },
                plugins: {
                    datalabels: {
                      display: true,
                      align: 'bottom',
                      backgroundColor: '#ccc',
                      borderRadius: 3
                    },
                  }
              }
        });

        return projectStats.getUrl()
    }

    getMilestoneLink() {
        const memberStats = new ChartJsImage();
        let labels = _.pluck(this.report.milestones, 'title')
        let stats = _.pluck(this.report.milestones, 'stats')

        memberStats.setConfig({
            type: 'bar',  
            data: { 
                labels: Object.keys(this.users), 
                datasets: [
                    { label: '[h]', data: Object.values(this.users)},
                ]
            },
            options: {
                responsive: true,
                legend: {
                  position: "top"
                },
                title: {
                  display: true,
                  text: "Members"
                },
                plugins: {
                    datalabels: {
                      display: true,
                      align: 'bottom',
                      backgroundColor: '#ccc',
                      borderRadius: 3
                    },
                  }
              }
        });

        return memberStats.getUrl();
    }

    getMemeberLink(){
        const memberStats = new ChartJsImage();
        memberStats.setConfig({
            type: 'bar',
            data: {
                labels: Object.keys(this.users),
                datasets: [
                    { label: '[h]', data: Object.values(this.users)},
                ]
            },
            options: {
                responsive: true,
                legend: {
                    position: "top"
                },
                title: {
                    display: true,
                    text: "Members"
                },
                plugins: {
                    datalabels: {
                        display: true,
                        align: 'bottom',
                        backgroundColor: '#ccc',
                        borderRadius: 3
                    },
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