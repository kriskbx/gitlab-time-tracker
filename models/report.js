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
    project() {
        let promise = this.get(`projects/${encodeURIComponent(this.config.get('project'))}`);
        promise.then(project => this.project = new Project(this.config, project.body));

        return promise;
    }

    /**
     * query and set merge requests
     * @returns {Promise}
     */
    mergeRequests() {
        let promise = this.all(`projects/${this.project.id}/merge_requests${this.params()}`);
        promise.then(mergeRequests => this.mergeRequests = report.filter(mergeRequests));

        return promise;
    }

    /**
     * query and set issues
     * @returns {Promise}
     */
    issues() {
        let promise = this.all(`projects/${this.project.id}/issues${this.params()}`);
        promise.then(issues => this.issues = report.filter(issues));

        return promise;
    }

    /**
     * filter empty
     * @param issues
     * @returns {Array}
     */
    static filter(issues) {
        return issues.filter(issue => issue.times.length > 0);
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
            if (moment(item.updated_at).isBefore(this.config.get('from'))) {
                if (advance) advance();
                return done();
            }

            // collect items, query times & stats
            collect.push(item = new model(this.config, item));
            item.notes()
                .then(() => item.times())
                .catch(error => done(error))
                .then(() => item.stats())
                .catch(error => done(error))
                .then(() => {
                    if (advance) advance();
                    done();
                });
        });

        promise.then(() => this[input] = collect);
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