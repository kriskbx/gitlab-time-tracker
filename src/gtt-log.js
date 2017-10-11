const _ = require('underscore');
const program = require('commander');
const colors = require('colors');
const moment = require('moment');

const Config = require('./include/file-config');
const Cli = require('./include/cli');
const Time = require('./models/time');
const Tasks = require('./include/tasks');

program
    .option('--verbose', 'show verbose output')
    .option('--hours_per_day <hours>', 'hours per day for human readable time formats')
    .option('--time_format <time_format>', 'time format')
    .parse(process.argv);

Cli.verbose = program.verbose;

let config = new Config(__dirname).set('hoursPerDay', program.hours_per_day),
    tasks = new Tasks(config),
    timeFormat = config.set('timeFormat', program.time_format).get('timeFormat');

timeFormat = _.isObject(timeFormat) && timeFormat['log'] ? timeFormat['log'] : timeFormat;

function toHumanReadable(input) {
    return Time.toHumanReadable(Math.ceil(input), config.get('hoursPerDay'), timeFormat);
}

tasks.log()
    .then(({frames, times}) => {
            Object.keys(frames).sort().forEach(date => {
                if (!frames.hasOwnProperty(date)) return;

                console.log(`${moment(date).format('MMMM Do YYYY')} (${toHumanReadable(times[date])})`.green);
                frames[date]
                    .sort((a, b) => moment(a.start).isBefore(moment(b.start)) ? -1 : 1)
                    .forEach(frame => {
                        let issue = frame.resource.new ? `new ${frame.resource.type + ' "' + frame.resource.id.blue}"` : `${(frame.resource.type + ' #' + frame.resource.id).blue}`;
                        console.log(`  ${frame.id}  ${moment(frame.start).format('HH:mm').green} to ${moment(frame.stop).format('HH:mm').green}\t${toHumanReadable(frame.duration)}\t\t${frame.project.magenta}\t\t${issue}`)
                    });
            });
        }
    )
    .catch(error => Cli.error(error));
