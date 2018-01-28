const Base = require('./base');
const Report = require('../models/report');

class dump extends Base {
    constructor(config, report) {
        super(config, report);

        config.set('url', null, true);
        config.set('token', null, true);
        config.workDir = null;
        config.cache = null;

        let dump = {config};

        ['issues', 'mergeRequests'].forEach(type => {
            dump[type] =
                report[type].map(resource => {
                    return {
                        data: resource.data,
                        notes: resource.notes
                    };
                });
        });

        this.write(JSON.stringify(dump));
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