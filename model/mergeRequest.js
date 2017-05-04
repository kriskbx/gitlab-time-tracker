const hasTimes = require('./hasTimes');

class mergeRequest extends hasTimes {
    constructor(config, data = {}) {
        super(config);
        this.data = data;
    }

    get id() {
        return this.data.id;
    }

    get type() {
        return 'merge_requests';
    }
}

module.exports = mergeRequest;