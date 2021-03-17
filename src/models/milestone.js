const moment = require('moment');

const hasTimes = require('./hasTimes');
const Issue = require('./issue')

/**
 * issue model
 */
class milestone extends hasTimes {
    constructor(config, data = {}) {
        super(config);
        this.data = data;
        this.stats = {
            spent : 0,
            time_estimate : 0,
            total_time_spent : 0
        }
    }

    make(project, id, create = false) {
        let promise;

        if (create) {
            promise = this.post(`projects/${encodeURIComponent(project)}/milestones`, {title: id});
        } else {
            promise = this.get(`projects/${encodeURIComponent(project)}/milestones/${id}`);
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

    get project_id() {
        return this.data.project_id;
    }

    get title() {
        return this.data.title;
    }

    get description() {
        return this.data.description;
    }

    get state() {
        return this.data.state;
    }

    get created_at() {
        return moment(this.data.created_at);
    }

    get updated_at() {
        return moment(this.data.updated_at);
    }

    get due_date() {
        return this.data.due_date ? moment(this.data.due_date): null;
    }

    get start_date() {
        return this.data.start_date ? moment(this.data.start_date): null;
    }

    get expired() {
        return this.data.expired;
    }

    get spent() {
        return this.stats ? this.config.toHumanReadable(this.stats.spent, this._type) : null;
    }

    get time_estimate() {
        return this.stats ? this.config.toHumanReadable(this.stats.time_estimate, this._type) : null;
    }

    get total_estimate() {
        return this.stats ? this.config.toHumanReadable(this.stats.total_estimate, this._type) : null;
    }

    get _type() {
        return 'milestones';
    }

    get _typeSingular() {
        return 'Milestone';
    }

    getIssues(){
        return new Promise(resolve => {
            this.get(`projects/${encodeURIComponent(this.project_id)}/issues/?milestone=${this.title}`)
                .then(data => data.body)
                .then(rawIssues => {
                    this.issues = []
                    rawIssues.forEach(data => {
                        let issue = new Issue(this.config, data)
                        this.issues.push(issue)
                    })
                    resolve()
                })
        })
    }

    getStats(){
        return new Promise((resolve) => {
            this.parallel(this.issues, (issue, done) => {
                issue.getStats()
                    .then(() => {
                        this.stats.time_estimate += issue.stats.time_estimate;
                        this.stats.total_time_spent += issue.stats.total_time_spent;
                        this.stats.spent += issue.spent;
                        return done();
                    })
            }).then(() => resolve())
        })
    }

    async getNotes(){
        return new Promise(async resolve => {
            await this.getIssues();
            this.notes = [];
            for (const issue of this.issues) {
                await issue.getNotes()
                this.notes = this.notes.concat(issue.notes)
            }
            resolve()
        })
    }

}

module.exports = milestone;
