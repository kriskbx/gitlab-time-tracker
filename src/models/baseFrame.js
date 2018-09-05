const Config = require('../include/config');

const moment = require('moment-timezone');
const Hashids = require('hashids');
const hashids = new Hashids();

class baseFrame {
    /**
     * constructor.
     * @param config
     * @param id
     * @param type
     */
    constructor(config, id, type) {
        this.config = config;
        this.project = config.get('project');
        this.resource = {id, type};

        if(typeof id === 'string' || id instanceof String)
            this.resource.new = true;

        this.id = baseFrame.generateId();
        this._start = false;
        this._stop = false;
        this.timezone = config.get('timezone');
        this.notes = [];
    }

    static fromJson(config, json) {
        let frame = new this(config, json.resource.id, json.resource.type);
        frame.project = json.project;
        frame.id = json.id;
        frame._start = json.start;
        frame._stop = json.stop;
        frame.notes = json.notes;
        frame.timezone = json.timezone;
        frame.modified = json.modified;
        frame.validate();

        return frame;
    }

    validate() {
        moment.suppressDeprecationWarnings = true;

        if(!moment(this._start).isValid())
            throw `Error: Start date is not in a valid ISO date format!`;

        if(this._stop && !moment(this._stop).isValid())
            throw `Error: Stop date is not in a valid ISO date format!`;

        moment.suppressDeprecationWarnings = false;
    }

    _getCurrentDate() {
        if(this.timezone)
            return moment().tz(this.timezone).format();

        return moment();
    }

    static copy(frame) {
        return this.fromJson(Object.assign(new Config, frame.config), {
            id: frame.id,
            project: frame.project,
            resource: frame.resource,
            notes: frame.notes,
            start: frame._start,
            stop: frame._stop,
            timezone: frame.timezone,
            modified: frame.modified
        });
    }

    get duration() {
        return moment(this.stop).diff(this.start) / 1000;
    }

    get date() {
        return this.start;
    }

    get start() {
        return this.timezone ? moment(this._start).tz(this.timezone) : moment(this._start);
    }

    get stop() {
        return this.timezone ? this._stop ? moment(this._stop).tz(this.timezone) : false : (this._stop ? moment(this._stop) : false );
    }

    /**
     * generate a unique id
     * @returns {number}
     */
    static generateId() {
        return hashids.encode(new Date().getTime());
    }
}

module.exports = baseFrame;
