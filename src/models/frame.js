const fs = require('fs');
const path = require('path');
const moment = require('moment');
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
        this.start = false;
        this.stop = false;
        this.notes = [];
    }

    static fromJson(config, json) {
        let frame = new this(config, json.resource.id, json.resource.type);
        frame.project = json.project;
        frame.id = json.id;
        frame.start = json.start;
        frame.stop = json.stop;
        frame.notes = json.notes;

        return frame;
    }

    static fromFile(config, file) {
        return frame.fromJson(config, JSON.parse(fs.readFileSync(file)));
    }

    startMe() {
        this.start = new Date();
        this.write();

        return this;
    }

    stopMe() {
        this.stop = new Date();
        this.write();

        return this;
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
            start: this.start,
            stop: this.stop
        }, null, "\t"));
    }

    get file() {
        return path.join(this.config.frameDir, this.id + '.json');
    }

    get duration() {
        return moment(this.stop).diff(this.start) / 1000;
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