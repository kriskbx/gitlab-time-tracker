const hasTimes = require('./hasTimes');

/**
 * merge request model
 */
class mergeRequest extends hasTimes {
    constructor(config, data = {}) {
        super(config);
        this.data = data;
    }

    get iid() {
        return this.data.iid;
    }

    get id() {
        return this.data.id;
    }

    get _type() {
        return 'merge_requests';
    }
}

module.exports = mergeRequest;