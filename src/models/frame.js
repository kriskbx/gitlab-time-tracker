const fs = require('fs');
const path = require('path');
const BaseFrame = require('./baseFrame.js');

class frame extends BaseFrame {
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
}

module.exports = frame;
