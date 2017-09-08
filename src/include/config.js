const moment = require('moment');

const Time = require('./../models/time');

const dates = ['from', 'to'];
const defaults = {
    type: 'project',
    subgroups: false,
    url: 'https://gitlab.com/api/v4',
    token: false,
    proxy: false,
    project: false,
    from: "1970-01-01",
    to: moment().format(),
    iids: false,
    closed: false,
    milestone: false,
    hoursPerDay: 8,
    issueColumns: ['iid', 'title', 'spent', 'total_estimate'],
    mergeRequestColumns: ['iid', 'title', 'spent', 'total_estimate'],
    recordColumns: ['user', 'date', 'type', 'iid', 'time'],
    userColumns: false,
    dateFormat: 'DD.MM.YYYY HH:mm:ss',
    timeFormat: Time.defaultTimeFormat,
    output: 'table',
    excludeByLabels: false,
    includeByLabels: false,
    includeLabels: false,
    excludeLabels: false,
    query: ['issues', 'merge_requests'],
    report: ['stats', 'issues', 'merge_requests', 'records'],
    noHeadlines: false,
    noWarnings: false,
    quiet: false,
    showWithoutTimes: false,
    _perPage: 100,
    _parallel: 10,
    _verbose: false,
    _checkToken: false
};

/**
 * basic config
 */
class config {
    /**
     * construct
     */
    constructor() {
        this.data = defaults;
    }

    /**
     * set a value by the given key.
     * it won't get set if the value is null or undefined. you can force
     * setting the value by passing true as third parameter.
     * @param key
     * @param value
     * @param force
     * @returns {config}
     */
    set(key, value, force = false) {
        if (!force && (value === null || value === undefined)) return this;

        this.data[key] = value;

        return this;
    }

    /**
     * get a value by the given key
     * @param key
     * @returns {*}
     */
    get(key) {
        if (!dates.includes(key)) return this.data[key];

        return moment(this.data[key]);
    }

    /**
     * get a human readable version of the given time
     * @param input
     * @returns {string}
     */
    toHumanReadable(input) {
        return Time.toHumanReadable(input, this.get('hoursPerDay'), this.get('timeFormat'));
    }
}

module.exports = config;
