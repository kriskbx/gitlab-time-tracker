const _ = require('underscore');
const fs = require('fs');
const moment = require('moment');

const defaultFormats = {
    headline: h => `${h}\n`,
    warning: w => w,
    write: w => `\n${w}`
};

/**
 * Base output
 */
class base {
    /**
     * constructor
     * @param config
     * @param report
     */
    constructor(config, report) {
        this.config = config;
        this.report = report;
        this.out = '';
        this.formats = defaultFormats;
        this.calculate();
    }

    set format(value) {
        this.formats = Object.assign(this.formats, value);
    }

    /**
     * print a headline
     * @param string
     */
    headline(string) {
        if (this.config.get('noHeadlines')) return;
        this.write(this.formats.headline(string));
    }

    /**
     * print a warning
     * @param string
     */
    warning(string) {
        if (this.config.get('noWarnings')) return;
        this.write(this.formats.warning(string));
    }

    /**
     * add the given string
     * @param string
     * @returns {base}
     */
    write(string) {
        this.out += this.formats.write(string);
        return this;
    }

    /**
     * make
     */
    make() {
        if (this.config.get('report').includes('stats')) {
            this.makeStats();
        }

        if (this.config.get('report').includes('issues')) {
            this.makeIssues();
        }

        if (this.config.get('report').includes('merge_requests')) {
            this.makeMergeRequests();
        }

        if (this.config.get('report').includes('records')) {
            this.makeRecords();
        }
    }

    /**
     * render to stdout
     */
    toStdOut() {
        console.log(this.out);
    }

    /**
     * render to file
     */
    toFile(file, resolve) {
        fs.writeFileSync(file, this.out);
        if (resolve) resolve();
    }

    /**
     * calculate stats
     */
    calculate() {
        let totalEstimate = 0;
        let totalSpent = 0;
        let spent = 0;
        let users = {};
        let projects = {};
        let times = [];

        ['issues', 'mergeRequests'].forEach(type => {
            this.report[type].forEach(issue => {
                issue.times.forEach(time => {
                    if (!users[time.user]) users[time.user] = 0;
                    if (!projects[time.project_namespace]) projects[time.project_namespace] = 0;

                    users[time.user] += time.seconds;
                    projects[time.project_namespace] += time.seconds;

                    spent += time.seconds;
                    times.push(time);
                });

                totalEstimate += parseInt(issue.stats.time_estimate);
                totalSpent += parseInt(issue.stats.total_time_spent);
            });

            this.report[type].sort((a, b) => {
                if (a.iid === b.iid) return 0;

                return (a.iid - b.iid) < 0 ? 1 : -1;
            });
        });


        this.times = times;
        this.times.sort((a, b) => {
            if (a.date.isSame(b.date)) return 0;

            return a.date.isBefore(b.date) ? 1 : -1;
        });
        this.users = _.mapObject(users, user => this.config.toHumanReadable(user, 'stats'));

        this.projects = _.mapObject(projects, project => this.config.toHumanReadable(project, 'stats'));
        this.stats = {
            'total estimate': this.config.toHumanReadable(totalEstimate, 'stats'),
            'total spent': this.config.toHumanReadable(totalSpent, 'stats'),
            'spent': this.config.toHumanReadable(spent, 'stats')
        };
    }

    /**
     * prepare the given object by only returning
     * the given columns/properties and formatting
     * special properties like moment instances
     * @param obj
     * @param columns
     * @returns {Array}
     */
    prepare(obj = {}, columns = []) {
        return columns.map(column => {
            if (moment.isMoment(obj[column]))
                return obj[column].format(this.config.get('dateFormat'));

            if (obj[column] === undefined || obj[column] === null)
                return '';

            return obj[column];
        });
    }
}

module.exports = base;