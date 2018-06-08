const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const Hashids = require('hashids');
const hashids = new Hashids();

class frame {
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

        this.id = frame.generateId();
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
        frame.validate();

        return frame;
    }

    static fromFile(config, file) {
        return frame.fromJson(config, JSON.parse(fs.readFileSync(file)));
    }

    startMe() {
        this._start = this._getCurrentDate();
        this.write();

        return this;
    }

    stopMe() {
        this._stop = this._getCurrentDate();
        this.write();

        return this;
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

    /**
     * assert file exists
     */
    assertFile() {
        if (!fs.existsSync(this.file)) fs.appendFileSync(this.file, '');
    }

    /**
     * write data to file
     */
    write() {
        if (fs.existsSync(this.file)) fs.unlinkSync(this.file);
        fs.appendFileSync(this.file, JSON.stringify({
            id: this.id,
            project: this.project,
            resource: this.resource,
            notes: this.notes,
            start: this._start,
            stop: this._stop,
            timezone: this.timezone
        }, null, "\t"));
    }

    get file() {
        return path.join(this.config.frameDir, this.id + '.json');
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
        return this.timezone ? moment(this._stop).tz(this.timezone) : (this._stop ? moment(this._stop) : false );
    }

    /**
     * generate a unique id
     * @returns {number}
     */
    static generateId() {
        return hashids.encode(new Date().getTime());
    }
}

module.exports = frame;