const _ = require('underscore');
const colors = require('colors');
const spinner = require('node-spinner')();
const cursor = require('cli-cursor');
const progress = require('progress');
spinner.set('|/-\\');

/**
 * cli helper
 */
class cli {
    constructor(args) {
        this.args = args;
        this.data = [];
    }

    /*
     * emojis
     */
    static get look() {
        return '🔍';
    }

    static get fetch() {
        return '📦';
    }

    static get process() {
        return '⚙';
    }

    static get output() {
        return '📃';
    }

    static get party() {
        return '🥑';
        // return '🍺';
    }

    /**
     * print done message
     */
    static done() {
        console.log(`\n${cli.party}  Finished!`.green);
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

        this.active = {
            started: new Date(),
            message: `\r${message}... `.bold.grey,
            bar: new progress(`${message} (:current/:total) [:bar] :percent - :minutesm left`, {
                total,
                clear: true,
                width: 40,
                renderThrottle: 100
            }),
            interval: setInterval(() => {
                if (!this.active.bar || this.active.bar.complete) return clearInterval(this.active.interval);
                this.tick(0);
            }, 1000)
        };

        this.tick();
        return cli.promise();
    }

    /**
     * bar tick
     * @param amount
     */
    static tick(amount = 0) {
        if (!this.active.bar || !this.active.started) return;

        let left;

        if(this.active.bar.curr > 0) {
            let elapsed = Math.ceil((new Date() - this.active.started) / 1000);
            left = ((elapsed / this.active.bar.curr) * (this.active.bar.total - this.active.bar.curr)) / 60;
            left = left < 1 ? `<1` : Math.ceil(left);
        } else {
            left = 0;
        }

        this.active.bar.tick(amount, {
            minutes: left
        });
    }

    /**
     * advance an existing bar
     */
    static advance() {
        this.tick(1);
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
        cli.resolve();
        process.stdout.write(`${this.active.message}` + `✓\n`.green);

        return cli.promise();
    }

    /**
     * stop a list item with an x
     * @param message
     * @param error
     * @returns {*}
     */
    static x(message = false, error = false) {
        cli.resolve();
        process.stdout.write(`${this.active.message}` + `✗\n`.red);

        if (message) cli.error(message, error);
        return cli.promise();
    }

    /**
     * stop and resolve a list or bar
     */
    static resolve(show = true) {
        cursor.toggle(show);
        if (this.active && this.active.interval) clearInterval(this.active.interval);
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

        process.exit(1);
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