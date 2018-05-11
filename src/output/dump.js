const Base = require('./base');
const Report = require('../models/report');

class dump extends Base {
    constructor(config, report) {
        super(config, report);

        config.set('url', null, true);
        config.set('token', null, true);
        config.set('_createDump', false);
        config.workDir = null;
        config.cache = null;

        this.write(JSON.stringify(config));
    }

    makeStats() {
    }

    makeIssues() {
    }

    makeMergeRequests() {
    }

    makeRecords() {
    }
}

module.exports = dump;