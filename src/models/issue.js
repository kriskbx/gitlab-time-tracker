const _ = require('underscore');
const moment = require('moment');

const hasTimes = require('./hasTimes');

/**
 * issue model
 */
class issue extends hasTimes {
    constructor(config, data = {}) {
        super(config);
        this.data = data;
    }

    make(project, id, create = false) {
        let promise;

        if (create) {
            promise = this.post(`projects/${encodeURIComponent(project)}/issues`, {title: id});
        } else {
            promise = this.get(`projects/${encodeURIComponent(project)}/issues/${id}`);
        }

        promise.then(issue => {
            this.data = issue.body;
            return promise;
        });

        return promise;
    }

    list(project, state, my) {
      return new Promise((resolve, reject) => {
        let promise;
        const query = `scope=${my ? "assigned-to-me" : "all"}&state=${state}`;
        if (project) {
          promise = this.get(`projects/${encodeURIComponent(project)}/issues?${query}`);
        } else {
          promise = this.get(`issues/?${query}`);
        }
        promise.then(response => {
          const issues = response.body.map(issue => new this.constructor(this.config, issue))
          resolve(issues)
        });
        promise.catch(error => reject(error))
      })
    }

    /*
     * properties
     */
    get iid() {
        return this.data.iid;
    }

    get id() {
        return this.data.id;
    }

    get title() {
        return this.data.title;
    }

    get project_id() {
        return this.data.project_id;
    }

    get description() {
        return this.data.description;
    }

    get labels() {
        let labels = _.difference(this.data.labels, this.config.get('excludeLabels'));
        let include = this.config.get('includeLabels');
        return include.length > 0 ? _.intersection(labels, include) : labels;
    }

    get milestone() {
        return this.data.milestone ? this.data.milestone.title : null;
    }

    get assignee() {
        return this.data.assignee ? this.data.assignee.username : null;
    }

    get author() {
        return this.data.author.username;
    }

    get closed() {
        return !!this.data.closed;
    }

    get updated_at() {
        return moment(this.data.updated_at);
    }

    get created_at() {
        return moment(this.data.created_at);
    }

    get state() {
        return this.data.state;
    }

    get spent() {
        return this.config.toHumanReadable(this.timeSpent, this._type);
    }

    get total_spent() {
        return this.stats ? this.config.toHumanReadable(this.stats.total_time_spent, this._type) : null;
    }

    get total_estimate() {
        return this.stats ? this.config.toHumanReadable(this.stats.time_estimate, this._type) : null;
    }

    get _type() {
        return 'issues';
    }

    get _typeSingular() {
        return 'Issue';
    }
}

module.exports = issue;
