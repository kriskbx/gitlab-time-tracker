const _ = require('underscore');

const Base = require('./base');

/**
 * owner model
 */
class owner extends Base {
    constructor(config) {
        super(config);
        this.projects = [];
        this.groups = [];
        this.users = [];
    }

    /**
     * is authorized?
     * @returns {Promise}
     */
    authorized() {
        if (!this.config.get('_checkToken')) return new Promise(r => r());

        return new Promise((resolve, reject) => {
            this.get('broadcast_messages')
                .then(() => resolve())
                .catch(e => {
                    if (e.statusCode === 403) resolve();
                    reject(e);
                });
        });
    }

    /**
     * query and set the group
     * @returns {Promise}
     */
    getGroup() {
        return new Promise((resolve, reject) => {
            this.get(`groups`)
                .then(groups => {
                    if (groups.body.length === 0) return reject('Group not found');
                    groups = groups.body;

                    let filtered = groups.filter(group => group.full_path === this.config.get('project'));
                    if (filtered.length === 0) return reject('Group not found');
                    this.groups = this.groups.concat(filtered);
                    resolve();
                })
                .catch(e => reject(e));
        });
    }

    /**
     * get sub groups
     * @returns {Promise}
     */
    getSubGroups() {
        return new Promise((resolve, reject) => {
            this.get(`groups`)
                .then(groups => {
                    if (groups.body.length === 0) return resolve();

                    let filtered = this._filterGroupsByParents(groups.body, this.groups.map(g => g.id));
                    if (filtered.length === 0) return resolve();

                    this.groups = this.groups.concat(filtered);
                    resolve();
                })
                .catch(e => reject(e));
        });
    }

    _filterGroupsByParents(groups, parents) {
        let filtered = groups.filter(group => {
            return parents.indexOf(group.parent_id) !== -1;
        });

        if (filtered.length !== 0) {
            filtered = filtered.concat(this._filterGroupsByParents(groups, filtered.map(g => g.id)));
        }

        return filtered;
    }

    // /**
    //  * query and set the user
    //  * @returns {Promise}
    //  */
    // getUser() {
    //     return new Promise((resolve, reject) => {
    //         this.get(`users/?username=${encodeURIComponent(this.config.get('project'))}`)
    //             .then(user => {
    //                 if (user.body.length === 0) return reject();
    //                 let filtered = user.body.filter(u => u.username === this.config.get('project'));
    //                 if (filtered.length === 0) return reject();
    //                 this.user = filtered[0];
    //                 resolve();
    //             })
    //             .catch(e => reject(e));
    //     });
    // }
    //
    // /**
    //  * query and set the projects by a user
    //  * @returns {Promise}
    //  */
    // getProjectsByUser() {
    //     return new Promise((resolve, reject) => {
    //         this.get(`users/${this.user.id}/projects`)
    //             .then(projects => {
    //                 this.projects = this.projects.concat(projects.body);
    //                 resolve();
    //             })
    //             .catch(e => reject(e));
    //     });
    // }

    /**
     * query and set the projects by a user
     * @returns {Promise}
     */
    getProjectsByGroup() {
        return this.parallel(this.groups, (group, done) => {
            this.all(`groups/${group.id}/projects`)
                .then(projects => {
                    this.projects = projects;
                    done();
                })
                .catch(e => done(e));
        });
    }
}

module.exports = owner;
