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
        this.projectMembers = data.members ? data.members : [];
    }

    /**
     * make
     * @param name
     */
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
        return new Promise((resolve, reject) => {
            this.get(`projects/${this.id}/members`)
                .then(response => {
                    this.projectMembers = this.projectMembers.concat(response.body);
                    return new Promise(r => r());
                })
                .then(() => {
                    if (!this.data.namespace || !this.data.namespace.kind || this.data.namespace.kind !== "group") return resolve();

                    this.get(`groups/${this.data.namespace.id}/members`)
                        .then(response => {
                            this.projectMembers = this.projectMembers.concat(response.body);
                            resolve();
                        })
                        .catch(e => reject(e));
                })
                .catch(e => reject(e));
        });
    }

    /*
     * properties
     */
    get id() {
        return this.data.id;
    }

    get name() {
        return this.data.path_with_namespace;
    }

    get users() {
        return this.projectMembers.map(member => member.username);
    }
}

module.exports = project;