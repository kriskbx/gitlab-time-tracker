const Base = require('./base');

/**
 * project model
 */
class project extends Base {
    /**
     * construct
     * @param config
     * @param data
     */
    constructor(config, data) {
        super(config);
        this.data = data;
    }

    make(name) {
        let promise = this.get(`projects/${encodeURIComponent(name)}`);
        promise.then(project => this.data = project.body);

        return promise;
    }

    /**
     * set members
     * @returns {Promise}
     */
    members() {
        let promise = this.get(`projects/${this.id}/members`);
        promise.then(response => this.members = response.body);

        return promise;
    }

    /*
     * properties
     */
    get id() {
        return this.data.id;
    }

    get users() {
        return this.members.map(member => member.username);
    }
}

module.exports = project;