const hasTimes = require('./hasTimes');

class issue extends hasTimes {
    constructor(config, data = {}) {
        super(config);
        this.data = data;
    }

    get id() {
        return this.data.id;
    }

    get type() {
        return 'issues';
    }
}

module.exports = issue;