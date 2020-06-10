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
        return this.data.state === 'closed';
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

    get due_date() {
        return this.data.due_date ? moment(this.data.due_date): null;
    }

    get closed_at() {
        return this.data.closed_at ? moment(this.data.closed_at): null;
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
