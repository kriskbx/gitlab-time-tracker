const _ = require('underscore');
const moment = require('moment');

const Base = require('./base');
const Time = require('./time');

const regex = /added (.*) of time spent/i;
const subRegex = /subtracted (.*) of time spent/i;

/**
 * base model for models that have times
 */
class hasTimes extends Base {
    /**
     * create time
     * @param time
     * @returns {*}
     */
    createTime(time) {
        return this.post(`projects/${this.data.project_id}/${this._type}/${this.iid}/add_spent_time`, {
            duration: Time.toHumanReadable(time, this.config.get('hoursPerDay'), '[%sign][%days>d ][%hours>h ][%minutes>m ][%seconds>s]')
        });
    }

    /**
     * set stats
     * @returns {Promise}
     */
    getStats() {
        let promise = this.get(`projects/${this.data.project_id}/${this._type}/${this.iid}/time_stats`);
        promise.then(response => this.stats = response.body);

        return promise;
    }

    /**
     * set notes
     * @returns {Promise}
     */
    getNotes() {
        let promise = this.all(`projects/${this.data.project_id}/${this._type}/${this.iid}/notes`);
        promise.then(notes => this.notes = notes);

        return promise;
    }

    /**
     * set times (call set notes first)
     * @returns {Promise}
     */
    getTimes() {
        let times = [];
        let timeSpent = 0;
        let timeUsers = {};

        let promise = this.parallel(this.notes, (note, done) => {
            let created = moment(note.created_at), match, subMatch;

            if (
                // filter out user notes
            !note.system ||
            // only include times by the configured user
            (this.config.get('user') && this.config.get('user') !== note.author.username) ||
            // filter out times that are not in the given time frame
            !(created.isSameOrAfter(this.config.get('from')) && created.isSameOrBefore(this.config.get('to'))) ||
            // filter out notes that are no time things
            !(match = regex.exec(note.body)) && !(subMatch = subRegex.exec(note.body))
            ) return done();

            if (!timeUsers[note.author.username]) timeUsers[note.author.username] = 0;
            let time = new Time(match ? match[1] : `-${subMatch[1]}`, note, this, this.config);

            timeSpent += time.seconds;
            timeUsers[note.author.username] += time.seconds;

            times.push(time);

            done();
        });

        promise.then(() => {
            _.each(timeUsers, (time, name) => this[`time_${name}`] = this.config.toHumanReadable(time));
            this.timeSpent = timeSpent;
            this.times = times
        });

        return promise;
    }
}

module.exports = hasTimes;