const _ = require('underscore');
const moment = require('moment');

const defaultTimeFormat = '[%sign][%days>d ][%hours>h ][%minutes>m ][%seconds>s]';
const mappings = ['complete', 'sign', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds'];
const regex = /^(?:([-])\s*)?(?:(\d+)mo\s*)?(?:(\d+)w\s*)?(?:(\d+)d\s*)?(?:(\d+)h\s*)?(?:(\d+)m\s*)?(?:(\d+)s\s*)?$/;
const conditionalRegex = /(\[\%([^\>\]]*)\>([^\]]*)\])/ig;
const roundedRegex = /(\[\%([^\>\]]*)\:([^\]]*)\])/ig;
const conditionalSimpleRegex = /([0-9]*)\>(.*)/ig;
const defaultRegex = /(\[\%([^\]]*)\])/ig;

Number.prototype.padLeft = function (n, str) {
    return Array(n - String(this).length + 1).join(str || '0') + this;
};

/**
 * time model
 */
class time {
    /**
     * construct
     * @param timeString
     * @param note
     * @param {hasTimes} parent
     * @param config
     */
    constructor(timeString, date = null, note, parent, config) {
        this.data = note;
        this._date = date;
        this.parent = parent;
        this.config = config;

        if(!timeString) {
            return;
        }

        this.seconds = time.parse(timeString, this._hoursPerDay, this._daysPerWeek, this._weeksPerMonth);
    }

    /*
     * properties
     */
    static get defaultTimeFormat() {
        return defaultTimeFormat;
    }

    get user() {
        return this.data.author.username;
    }

    get date() {
        return this._date ? moment(this._date) : moment(this.data.created_at);
    }

    get type() {
        return this.data.noteable_type;
    }

    get project_id() {
        return this.parent.data.project_id;
    }

    get iid() {
        return this.parent.iid;
    }

    get time() {
        return time.toHumanReadable(this.seconds, this._hoursPerDay, this._timeFormat);
    }

    /**
     * Title of the linked Noteable object (Issue/MergeRequest)
     *
     * @returns {String|null}
     */
    get title() {
        return this.parent && this.parent.title || null;
    }

    get _timeFormat() {
        return this.config && this.config.get('timeFormat', 'records') ? this.config.get('timeFormat', 'records') : '';
    }

    get _hoursPerDay() {
        return this.config && this.config.get('hoursPerDay') ? parseInt(this.config.get('hoursPerDay')) : 8;
    }

    get _daysPerWeek() {
        return this.config && this.config.get('daysPerWeek') ? parseInt(this.config.get('daysPerWeek')) : 5;
    }

    get _weeksPerMonth() {
        return this.config && this.config.get('weeksPerMonth') ? parseInt(this.config.get('weeksPerMonth')) : 4;
    }

    /**
     * parse human readable to seconds
     * @param string
     * @param hoursPerDay
     * @param daysPerWeek
     * @param weeksPerMonth
     * @returns {*}
     */
    static parse(string, hoursPerDay = 8, daysPerWeek = 5, weeksPerMonth = 4) {
        let match, parsed;

        if ((match = regex.exec(string)) === null) return false;
        parsed = _.object(mappings, match.map(i => i === undefined ? 0 : i));

        return (parsed.sign ? -1 : 1) * (parseInt(parsed.seconds)
            + (parseInt(parsed.minutes) * 60)
            + (parseInt(parsed.hours) * 60 * 60)
            + (parseInt(parsed.days) * hoursPerDay * 60 * 60)
            + (parseInt(parsed.weeks) * daysPerWeek * hoursPerDay * 60 * 60)
            + (parseInt(parsed.months) * weeksPerMonth * daysPerWeek * hoursPerDay * 60 * 60));
    }

    /**
     * get human readable
     * @param input
     * @param hoursPerDay
     * @param format
     * @returns {string}
     */
    static toHumanReadable(input, hoursPerDay = 8, format = time.defaultTimeFormat) {
        let sign = parseInt(input) < 0 ? '-' : '', output = format, match;
        input = Math.abs(input);

        let secondsInADay = 60 * 60 * hoursPerDay;
        let secondsInAnHour = 60 * 60;
        let secondsInAMinute = 60;

        let inserts = {};

        inserts.sign = sign;
        inserts.days_overall = input / secondsInADay;
        inserts.days_overall_comma = inserts.days_overall.toString().replace('.', ',');
        inserts.days = Math.floor(inserts.days_overall);
        inserts.Days = inserts.days.padLeft(2, 0);
        inserts.hours_overall = input / secondsInAnHour;
        inserts.hours_overall_comma = inserts.hours_overall.toString().replace('.', ',');
        inserts.hours = Math.floor((input % secondsInADay) / secondsInAnHour);
        inserts.Hours = inserts.hours.padLeft(2, 0);
        inserts.minutes_overall = input / secondsInAMinute;
        inserts.minutes_overall_comma = (inserts.minutes_overall).toString().replace('.', ',');
        inserts.minutes = Math.floor(((input % secondsInADay) % secondsInAnHour) / secondsInAMinute);
        inserts.Minutes = inserts.minutes.padLeft(2, 0);
        inserts.seconds_overall = input;
        inserts.seconds = ((input % secondsInADay) % secondsInAnHour) % secondsInAMinute;
        inserts.Seconds = inserts.seconds.padLeft(2, 0);

        // rounded
        while ((match = roundedRegex.exec(format)) !== null) {
            if (match.index === roundedRegex.lastIndex) roundedRegex.lastIndex++;
            let time, conditionalMatch, decimals = match[3];

            if ((conditionalMatch = conditionalSimpleRegex.exec(decimals)) !== null) {
                decimals = conditionalMatch[1]
            }

            decimals = parseInt(decimals);
            time = Math.ceil(inserts[match[2]] * Math.pow(10, decimals)) / Math.pow(10, decimals);
            output = output.replace(match[0], time !== 0 && conditionalMatch ? time + conditionalMatch[2] : time);
        }

        // conditionals
        while ((match = conditionalRegex.exec(format)) !== null) {
            if (match.index === conditionalRegex.lastIndex) conditionalRegex.lastIndex++;
            output = output.replace(match[0], inserts[match[2]] > 0 ? inserts[match[2]] + match[3] : '');
        }

        // default
        format = output;
        while ((match = defaultRegex.exec(format)) !== null) {
            if (match.index === defaultRegex.lastIndex) defaultRegex.lastIndex++;
            output = output.replace(match[0], inserts[match[2]]);
        }

        return output.trim();
    }
}

module.exports = time;
