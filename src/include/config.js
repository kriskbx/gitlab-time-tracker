const moment = require('moment');
const _ = require('underscore');

const Time = require('./../models/time');
const EventEmitter = require('events');

const dates = ['from', 'to'];
const objectsWithDefaults = ['timeFormat', 'columns'];
const defaults = {
    type: 'project',
    subgroups: false,
    url: 'https://gitlab.com/api/v4',
    token: false,
    proxy: false,
    insecure: false,
    project: false,
    from: "1970-01-01",
    to: moment().format(),
    iids: false,
    closed: false,
    milestone: false,
    hoursPerDay: 8,
    daysPerWeek: 5,
    weeksPerMonth: 4,
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
    timezone: "UTC",
    _perPage: 100,
    _parallel: 10,
    _verbose: false,
    _checkToken: true,
    _skipDescriptionParsing: false
};

/**
 * basic config
 */
class config extends EventEmitter {
    /**
     * construct
     */
    constructor() {
        super();

        this.data = _.extend({}, defaults);
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
     * @param subKey
     * @returns {*}
     */
    get(key, subKey = false) {
        if (dates.includes(key))
            return moment(this.data[key]);

        if (objectsWithDefaults.includes(key) && _.isObject(this.data[key]))
            return subKey && this.data[key][subKey] ? this.data[key][subKey] : defaults[key];

        return this.data[key];
    }

    /**
     * get a human readable version of the given time
     * @param input
     * @param timeFormat
     * @returns {string}
     */
    toHumanReadable(input, timeFormat = false) {
        return Time.toHumanReadable(input, this.get('hoursPerDay'), this.get('timeFormat', timeFormat));
    }
}

module.exports = config;
