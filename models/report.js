const _ = require('underscore');
const moment = require('moment');

const Base = require('./base');
const Issue = require('./issue');
const MergeRequest = require('./mergeRequest');
const Project = require('./project');

/**
 * report model
 */
class report extends Base {
    /**
     * constructor.
     * @param config
     */
    constructor(config) {
        super(config);

        this.issues = [];
        this.mergeRequests = [];
    }

    /**
     * get params for querying issues and merge requests
     * @returns {string}
     */
    params() {
        let params = [];

        if (this.config.get('iids') && this.config.get('query').length === 1) {
            params.push(`iids=${this.config.get('iids').join(',')}`)
        }

        if (!this.config.get('closed')) {
            params.push(`state=opened`);
        }

        if (this.config.get('includeByLabels')) {
            params.push(`labels=${this.config.get('includeByLabels').join(',')}`);
        }

        if (this.config.get('milestone')) {
            params.push(`milestone=${this.config.get('milestone')}`);
        }

        return `?${params.join('&')}`;
    }

    /**
     * query and set the project
     * @returns {Promise}
     */
    getProject() {
        let promise = this.get(`projects/${encodeURIComponent(this.config.get('project'))}`);
        promise.then(project => this.project = new Project(this.config, project.body));

        return promise;
    }

    /**
     * query and set merge requests
     * @returns {Promise}
     */
    getMergeRequests() {
        let promise = this.all(`projects/${this.project.id}/merge_requests${this.params()}`);
        promise.then(mergeRequests => this.mergeRequests = mergeRequests);

        return promise;
    }

    /**
     * query and set issues
     * @returns {Promise}
     */
    getIssues() {
        let promise = this.all(`projects/${this.project.id}/issues${this.params()}`);
        promise.then(issues => this.issues = issues);

        return promise;
    }

    /**
     * filter empty
     * @param issues
     * @returns {Array}
     */
    filter(issues) {
        return issues.filter(issue => this.config.get('showWithoutTimes') || (issue.times && issue.times.length > 0));
    }

    /**
     * process the given input
     * @param input
     * @param model
     * @param advance
     * @returns {*|Promise}
     */
    process(input, model, advance = false) {
        let collect = [];

        let promise = this.parallel(this[input], (item, done) => {
            // filter out things that are too old
            if (!this.config.get('showWithoutTimes') && moment(item.updated_at).isBefore(this.config.get('from'))) {
                if (advance) advance();
                return done();
            }

            // collect items, query times & stats
            collect.push(item = new model(this.config, item));
            item.getNotes()
                .then(() => item.getTimes())
                .catch(error => done(error))
                .then(() => item.getStats())
                .catch(error => done(error))
                .then(() => {
                    if (advance) advance();
                    done();
                });
        });

        promise.then(() => this[input] = this.filter(collect));
        return promise;
    }

    /**
     * process issues
     * @param advance
     * @returns {Promise}
     */
    processIssues(advance = false) {
        return this.process('issues', Issue, advance);
    }

    /**
     * process merge requests
     * @param advance
     * @return {Promise}
     */
    processMergeRequests(advance = false) {
        return this.process('mergeRequests', MergeRequest, advance);
    }
}

module.exports = report;