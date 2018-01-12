const _ = require('underscore');
const colors = require('colors');
const prompt = require('prompt');
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
    static get update() {
        return '⏱';
    }

    static get print() {
        return '🖨';
    }

    static get look() {
        return '🔍';
    }

    static get fetch() {
        return '📦';
    }

    static get process() {
        return '⚙️';
    }

    static get output() {
        return '📃';
    }

    static get merge() {
        return '📎';
    }

    static get party() {
        return '🥑';
    }

    /**
     * ask
     * @param message
     * @returns {Promise}
     */
    static ask(message) {
        return new Promise((resolve, reject) => {
            prompt.start();

            let question = {
                name: 'yesno',
                message: message,
                validator: /y[es]*|n[o]?/,
                warning: 'Must respond yes or no',
                default: 'yes'
            };

            prompt.get(question, function (error, result) {
                if (error || result.yesno === 'no' || result.yesno === 'n') return reject(error);

                resolve();
            });
        });
    }

    /**
     * print
     * @param string
     */
    static out(string) {
        if (cli.quiet) return;
        process.stdout.write(string);
    }

    /**
     * print done message
     */
    static done() {
        cli.out(`\n${cli.party}  Finished!\n`.green);
    }

    /**
     * print a warning
     * @param message
     */
    static warn(message) {
        cli.out(` Warning: ${message} `.bgWhite.black + "\n");
    }

    /**
     * create a new bar
     * @param message
     * @param total
     * @returns {*}
     */
    static bar(message, total) {
        cli.resolve(false);

        if (cli.quiet) return cli.promise();

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
                if (!cli.active.bar || cli.active.bar.complete) return clearInterval(cli.active.interval);
                cli.tick(0);
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
        if (!cli.active.bar || !cli.active.started) return;

        let left;

        if (cli.active.bar.curr > 0) {
            let elapsed = Math.ceil((new Date() - cli.active.started) / 1000);
            left = ((elapsed / cli.active.bar.curr) * (cli.active.bar.total - cli.active.bar.curr)) / 60;
            left = left < 1 ? `<1` : Math.ceil(left);
        } else {
            left = 0;
        }

        cli.active.bar.tick(amount, {
            minutes: left
        });
    }

    /**
     * advance an existing bar
     */
    static advance() {
        cli.tick(1);
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
            cli.out(cli.active.message + spinner.next().bold.blue);
        }, 100);

        return cli.promise();
    }

    /**
     * stop a list item with a check mark
     * @returns {*}
     */
    static mark() {
        cli.resolve();
        if (cli.active) cli.out(`${cli.active.message}` + `✓\n`.green);

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
        if (cli.active) cli.out(`${cli.active.message}` + `✗\n`.red);

        if (message) cli.error(message, error);
        return cli.promise();
    }

    /**
     * stop and resolve a list or bar
     */
    static resolve(show = true) {
        cursor.toggle(show);
        if (cli.active && cli.active.interval) clearInterval(cli.active.interval);
    }

    /**
     * show an error message
     * @param message
     * @param error
     * @returns {*}
     */
    static error(message, error) {
        cli.resolve();

        cli.out(`Error: ${message.red}` + '\n');
        if (error && cli.verbose) console.log(error);

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

        let projects = _.uniq(_.filter(this.args, arg => !Number.isNaN(new Number(arg))));
        this.args = _.difference(this.args, projects);

        return this.data.project = projects;
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