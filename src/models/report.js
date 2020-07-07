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
     * @param project
     */
    constructor(config, project) {
        super(config);

        this.projects = {};
        this.setProject(project);

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
     * set the project by the given data
     * @param project
     */
    setProject(project) {
        if (!project) return;

        this.projects[project.id] = project.path_with_namespace;
        this.project = new Project(this.config, project)
    }

    /**
     * query and set the project
     * @returns {Promise}
     */
    getProject() {
        let promise = this.get(`projects/${encodeURIComponent(this.config.get('project'))}`);
        promise.then(response => response.json()).then(project => this.setProject(project));

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

        let promise = this.parallel(this[input], (data, done) => {

            let item = new model(this.config, data);
            item.project_namespace = this.projects[item.project_id];

            item.getNotes()
                .then(() => item.getTimes())
                .catch(error => done(error))
                .catch(error => done(error))
                .then(() => item.getStats())
                .catch(error => done(error))
                .then(() => {
                    if (this.config.get('showWithoutTimes') || item.times.length > 0) {
                        collect.push(item);
                    }

                    if (advance) advance();
                    return done();
                });


            // collect items, query times & stats
            collect.push();
        });

        promise.then(() => this[input] = this.filter(collect));
        return promise;
    }

    /**
     * process all notes the given input
     * @param input
     * @param model
     * @param advance
     * @returns {*|Promise}
     */
    processNote(input, model, advance = false) {
        let collect = [];

        let promise = this.parallel(this[input], (data, done) => {

            let item = new model(this.config, data);
            item.project_namespace = this.projects[item.project_id];

            item.getNotes()
                .then(() => {
                    collect.push(item);

                    if (advance) advance();
                    return done();
                });


            // collect items, query times & stats
            collect.push();
        });

        promise.then(() => this[input] = collect);
        return promise;
    }

    /**
     * merge another report into this report
     * @param report
     */
    merge(report) {
        this.issues = this.issues.concat(report.issues);
        this.mergeRequests = this.mergeRequests.concat(report.mergeRequests);
        if (!this.members) this.members = [];
        this.members = this.members.concat(report.members ? report.members : []);
        this.projects = Object.assign(this.projects, report.projects);
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
     * process notes
     * @param advance
     * @returns {Promise}
     */
    processNotes(advance = false) {
        return this.processNote('issues', Issue, advance);
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