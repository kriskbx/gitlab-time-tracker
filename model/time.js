const _ = require('underscore');

const regex = /^(?:([-])\s*)?(?:(\d+)d\s*)?(?:(\d+)h\s*)?(?:(\d+)m\s*)?(?:(\d+)s\s*)?$/;
const mappings = ['complete', 'sign', 'days', 'hours', 'minutes', 'seconds'];

class time {
    constructor(string, data, config) {
        this.data = data;
        this.config = config;
        this.humanReadable = string;
        this.seconds = time.parse(string, this._hoursPerDay);
    }

    get _hoursPerDay() {
        this.config.get('hoursPerDay') ? this.config.get('hoursPerDay') : 8;
    }

    /**
     * parse human readable to seconds
     * @param string
     * @param hoursPerDay
     * @returns {*}
     */
    static parse(string, hoursPerDay = 8) {
        let match, parsed;

        if ((match = regex.exec(string)) === null) return false;
        parsed = _.object(mappings, match.map(i => i === undefined ? 0 : i));

        return (parsed.sign ? -1 : 1) * (parseInt(parsed.seconds)
            + (parseInt(parsed.minutes) * 60)
            + (parseInt(parsed.hours) * 60 * 60)
            + (parseInt(parsed.days) * hoursPerDay * 60 * 60));
    }
}

module.exports = time;