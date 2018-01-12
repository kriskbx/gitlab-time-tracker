const request = require('request-promise-native');
const url = require('url');
const async = require('async');

/**
 * base model
 */
class base {
    /**
     * construct
     * @param config
     */
    constructor(config) {
        this.config = config;

        this.url = config.get('url').endsWith('/') ? config.get('url') : `${config.get('url')}/`;
        this.token = config.get('token');

        this._perPage = this.config ? this.config.get('_perPage') : 100;
        this._parallel = this.config ? this.config.get('_parallel') : 4;
        this._proxy = this.config && this.config.get('proxy') ? this.config.get('proxy') : undefined;
        this._insecure = this.config && this.config.get('unsecure') ? this.config.get('unsecure') : false;
    }

    /**
     * query the given path
     * @param path
     * @param data
     * @returns {*}
     */
    post(path, data) {
        data.private_token = this.token;

        return request.post(`${this.url}${path}`, {
            json: true,
            body: data,
            insecure: this._insecure,
            proxy: this._proxy,
            resolveWithFullResponse: true,
            headers: {
                'PRIVATE-TOKEN': this.token
            }
        });
    }

    /**
     * query the given path
     * @param path
     * @param page
     * @param perPage
     * @returns {Promise}
     */
    get(path, page = 1, perPage = this._perPage) {
        path += (path.includes('?') ? '&' : '?') + `private_token=${this.token}`;
        path += `&page=${page}&per_page=${perPage}`;

        return request(`${this.url}${path}`, {
            json: true,
            insecure: this._insecure,
            proxy: this._proxy,
            resolveWithFullResponse: true,
            headers: {
                'PRIVATE-TOKEN': this.token
            }
        });
    }

    /**
     * query the given path and paginate automatically and in parallel
     * through all available pages
     * @param path
     * @param perPage
     * @param runners
     * @returns {Promise}
     */
    all(path, perPage = this._perPage, runners = this._parallel) {
        return new Promise((resolve, reject) => {
            let collect = [];

            this.get(path, 1, perPage).then(response => {
                response.body.forEach(item => collect.push(item));
                let pages = parseInt(response.headers['x-total-pages']);

                if (pages === 1) return resolve(collect);

                let tasks = base.createGetTasks(path, pages, 2, perPage);
                this.getParallel(tasks, collect, runners).then(() => {
                    resolve(collect);
                }).catch(error => reject(error));
            }).catch(err => reject(err));
        });
    }

    /**
     * perform the given worker function on the given tasks in parallel
     * @param tasks
     * @param worker
     * @param runners
     * @returns {Promise}
     */
    parallel(tasks, worker, runners = this._parallel) {
        return new Promise((resolve, reject) => {
            async.eachLimit(Array.from(tasks), runners, worker, error => {
                if (error) return reject(error);
                resolve();
            });
        });
    }

    /**
     * make multiple get requests by the given tasks and apply the
     * data to the given set
     * @param tasks
     * @param collect
     * @param runners
     * @returns {Promise}
     */
    getParallel(tasks, collect = [], runners = this._parallel) {
        return this.parallel(tasks, (task, done) => {
            this.get(task.path, task.page, task.perPage).then((response) => {
                response.body.forEach(item => collect.push(item));
                done();
            }).catch(error => done(error));
        }, runners);
    }

    /**
     * create a task list to get all pages from
     * the given path
     * @param path
     * @param to
     * @param from
     * @param perPage
     * @returns {Array}
     */
    static createGetTasks(path, to, from = 2, perPage = this._perPage) {
        let tasks = [];

        for (let i = from; i <= to; i++) {
            tasks.push({path, perPage, page: i})
        }

        return tasks;
    }
}

module.exports = base;