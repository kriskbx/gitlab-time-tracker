const hasTimes = require('./hasTimes');

/**
 * merge request model
 */
class mergeRequest extends hasTimes {
    constructor(config, data = {}) {
        super(config);
        this.data = data;
    }

    make(project, id) {
        let promise = this.get(`projects/${encodeURIComponent(project)}/merge_requests/${id}`);
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
        return this.config.toHumanReadable(this.timeSpent);
    }

    get total_spent() {
        return this.stats ? this.config.toHumanReadable(this.stats.total_time_spent) : null;
    }

    get total_estimate() {
        return this.stats ? this.config.toHumanReadable(this.stats.time_estimate) : null;
    }

    get _type() {
        return 'merge_requests';
    }
}

module.exports = mergeRequest;