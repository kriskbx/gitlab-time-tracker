const _ = require('underscore');
const colors = require('colors');
const spinner = require('node-spinner')();
const cursor = require('cli-cursor');
const progress = require('progress');
spinner.set('|/-\\');

class cli {
    /**
     * pass arguments to cli helper
     * @param args
     */
    constructor(args) {
        this.args = args;
        this.data = [];
    }

    static done() {
        console.log();
        console.log(`🍺 finished!`.green);
    }

    /**
     * print a warning
     * @param message
     */
    static warn(message) {
        console.log(` Warning: ${message} `.bgWhite.black);
    }

    /**
     * create a new bar
     * @param message
     * @param total
     * @returns {*}
     */
    static bar(message, total) {
        cli.resolve(false);

        let options = {
            total,
            clear: true,
            width: 40,
            renderThrottle: 100
        };

        this.active = {
            message: `\r${message}... `.bold.grey,
            bar: new progress(`${message} (:current/:total) [:bar] :percent - :etas left`, options)
        };

        this.active.bar.tick(0);
        return cli.promise();
    }

    /**
     * advance an existing bar
     */
    static advance() {
        if (!this.active.bar) return;
        this.active.bar.tick(1);
    }

    /**
     * create a new list, including a spinner
     * @param message
     * @returns {*}
     */
    static list(message) {
        cli.resolve(false);

        this.active = {message: `\r${message}... `.bold.grey};
        this.active.interval = setInterval(() => {
            process.stdout.write(this.active.message + spinner.next().bold.blue);
        }, 100);

        return cli.promise();
    }

    /**
     * stop a list item with a check mark
     * @returns {*}
     */
    static mark() {
        process.stdout.write(`${this.active.message}` + `✓\n`.green);

        cli.resolve();
        return cli.promise();
    }

    /**
     * stop a list item with an x
     * @param message
     * @param error
     * @returns {*}
     */
    static x(message = false, error = false) {
        process.stdout.write(`${this.active.message}` + `✗\n`.red);

        cli.resolve();
        if (message) cli.error(message, error);
        return cli.promise();
    }

    /**
     * stop and resolve a list or bar
     */
    static resolve(show = true) {
        cursor.toggle(show);
        if (this.active && this.active.interval) clearInterval(this.active.interval);
        if (this.active) this.active = false;
    }

    /**
     * show an error message
     * @param message
     * @param error
     * @returns {*}
     */
    static error(message, error) {
        cli.resolve();

        console.log(` Error: ${message} `.bgRed.white);
        if (error) console.log(error);

        return cli.promise();
    }

    /**
     * get a promise (for chaining promises)
     * @returns {Promise}
     */
    static promise() {
        return new Promise(resolve => {
            resolve();
        });
    }

    /**
     * parse the args and return the project argument
     * @returns {*}
     */
    project() {
        if (!this.args[0] && !this.data.project) return null;

        if (this.data.project) return this.data.project;

        return this.data.project = this.args.splice(0, 1).toString();
    }

    /**
     * parse the args and return an array of issues
     * @returns {*}
     */
    iids() {
        if (this.data.iids) return this.data.iids;

        this.data.iids = _.uniq(_.flatten(_.map(this.args, (issue) => {
            if (issue.indexOf(',') === -1) return issue;
            return issue.split(',');
        })));

        if (this.data.iids.length === 0) return null;

        return this.data.iids;
    }
}

module.exports = cli;