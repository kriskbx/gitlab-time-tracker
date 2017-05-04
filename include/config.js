const moment = require('moment');

const dates = ['from', 'to'];
const defaults = {
    url: 'https://gitlab.com/api/v4',
    token: false,
    project: false,
    iids: false,
    closed: false,
    milestone: false,
    hoursPerDay: 8,
    columns: ['iid', 'title', 'estimation', 'times'],
    dateFormat: 'Y-m-d H:i:s',
    timeFormat: '[%sign][%days>d ][%hours>h ][%minutes>m ][%seconds>s]',
    output: 'markdown',
    excludeByLabels: false,
    includeByLabels: false,
    includeLabels: false,
    excludeLabels: false,
    query: ['issues', 'merge_requests'],
    _perPage: 100,
    _parallel: 4
};

class config {
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
}

module.exports = config;