const _ = require('underscore');
const moment = require('moment');

const Base = require('./base');
const Time = require('./time');

const regex = /added (.*) of time spent(?: at (.*))?/i;
const subRegex = /deleted (.*) of spent time(?: from (.*))?/i;
const removeRegex = /Removed time spent/i;

/**
 * base model for models that have times
 */
class hasTimes extends Base {
    constructor(config) {
        super(config);
        this.times = [];
    }

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
        let times = [],
            timeSpent = 0,
            totalTimeSpent = 0,
            timeUsers = {},
            timeFormat = this.config.get('timeFormat', this._type);

        // sort by created at
        this.notes.sort((a, b) => {
            if (a.created_at === b.created_at) return 0;
            return moment(a.created_at).isBefore(b.created_at) ? -1 : 1;
        });

        let promise = this.parallel(this.notes, (note, done) => {
            let created = moment(note.created_at), match, subMatch;

            if ( //
            // filter out user notes
            !note.system ||
            // filter out notes that are no time things
            !(match = regex.exec(note.body)) && !(subMatch = subRegex.exec(note.body)) && !removeRegex.exec(note.body)
            ) return done();

            // change created date when explicitly defined
            if(match && match[2]) created = moment(match[2]);
            if(subMatch && subMatch[2]) created = moment(subMatch[2]);

            // create a time string and a time object
            let timeString = match ? match[1] : (subMatch ? `-${subMatch[1]}` : `-${Time.toHumanReadable(timeSpent)}`);
            let time = new Time(null, created, note, this, this.config);
            time.seconds = Time.parse(timeString, 8, 5, 4);

            // add to total time spent
            totalTimeSpent += time.seconds;

            if ( //
            // only include times by the configured user
            (this.config.get('user') && this.config.get('user') !== note.author.username) ||
            // filter out times that are not in the given time frame
            !(created.isSameOrAfter(moment(this.config.get('from'))) && created.isSameOrBefore(moment(this.config.get('to'))))
            ) return done();

            if (!timeUsers[note.author.username]) timeUsers[note.author.username] = 0;

            // add to time spent & add to user specific time spent
            timeSpent += time.seconds;
            timeUsers[note.author.username] += time.seconds;

            time.project_namespace = this.project_namespace;
            times.push(time);

            done();
        });

        promise = promise.then(() => new Promise(resolve => {
            let created = moment(this.data.created_at);

            if ( //
            // skip if description parsing is disabled
            this.config.get('_skipDescriptionParsing') ||
            // or time stats are not available
            !this.data.time_stats || !this.data.time_stats.total_time_spent ||
            // or the total time matches
            !this.data.time_stats ||
            totalTimeSpent === this.data.time_stats.total_time_spent ||
            // or the user is filtered out
            (this.config.get('user') && this.config.get('user') !== this.data.author.username) ||
            // or the issue is not within the given time frame
            !(created.isSameOrAfter(moment(this.config.get('from'))) && created.isSameOrBefore(moment(this.config.get('to'))))
            ) return resolve();

            let difference = this.data.time_stats.total_time_spent - totalTimeSpent,
                note = Object.assign({noteable_type: this._typeSingular}, this.data);

            times.unshift(new Time(Time.toHumanReadable(difference, this.config.get('hoursPerDay')), null, note, this, this.config));

            resolve();
        }));

        promise.then(() => {
            _.each(timeUsers, (time, name) => this[`time_${name}`] = Time.toHumanReadable(time, this.config.get('hoursPerDay'), timeFormat));
            this.timeSpent = timeSpent;
            this.times = times
        });

        return promise;
    }
}

module.exports = hasTimes;
