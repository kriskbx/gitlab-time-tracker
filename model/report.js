const _ = require('underscore');
const moment = require('moment');

const Base = require('./base');
const Issue = require('./issue');
const MergeRequest = require('./mergeRequest');

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
     * @returns {*}
     */
    project() {
        let promise = this.get(`projects/${encodeURIComponent(this.config.get('project'))}`);
        promise.then(project => this.project = project.body);

        return promise;
    }

    /**
     * query and set merge requests
     * @returns {Promise}
     */
    mergeRequests() {
        let promise = this.all(`projects/${this.project.id}/merge_requests${this.params()}`);
        promise.then(mergeRequests => this.mergeRequests = Array.from(mergeRequests));

        return promise;
    }

    /**
     * query and set issues
     * @returns {Promise}
     */
    issues() {
        let promise = this.all(`projects/${this.project.id}/issues${this.params()}`);
        promise.then(issues => this.issues = Array.from(issues));

        return promise;
    }

    /**
     * process the given input
     * @param input
     * @param model
     * @param advance
     * @returns {*|Promise}
     */
    process(input, model, advance = false) {
        let collect = new Set();

        let promise = this.parallel(input.reverse(), (item, done) => {
            // filter out things that are too old
            if (moment(item.updated_at).isBefore(this.config.get('from'))) return done();

            // collect items and query times
            collect.add(item = new model(this.config, item));
            item.notes()
                .then(() => item.times())
                .catch(error => done(error))
                .then(() => {
                    if (advance) advance();
                    done();
                });
        });

        promise.then(() => {
            input = Array.from(collect).reverse();
        });

        return promise;
    }

    /**
     * process issues
     * @returns {Promise|*}
     */
    processIssues(advance = false) {
        return this.process(this.issues, Issue, advance);
    }

    /**
     * process merge requests
     * @param advance
     */
    processMergeRequests(advance = false) {
        return this.process(this.mergeRequests, MergeRequest, advance);
    }
}

module.exports = report;