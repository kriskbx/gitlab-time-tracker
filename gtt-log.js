const _ = require('underscore');
const program = require('commander');
const colors = require('colors');
const moment = require('moment');

const Config = require('./include/file-config');
const Cli = require('./include/cli');
const Time = require('./models/time');
const Tasks = require('./include/tasks');

program.option('--verbose', 'show verbose output')
    .parse(process.argv);

Cli.verbose = program.verbose;

let config = new Config(__dirname),
    tasks = new Tasks(config);

function toHumanReadable(input) {
    return Time.toHumanReadable(Math.ceil(input), config.get('hoursPerDay'), config.get('timeFormat'));
}

tasks.log()
    .then(({frames, times}) => {
            Object.keys(frames).sort().forEach(date => {
                if (!frames.hasOwnProperty(date)) return;

                console.log(`${moment(date).format('MMMM Do YYYY')} (${toHumanReadable(times[date])})`.green);
                frames[date]
                    .sort((a, b) => moment(a.start).isBefore(moment(b.start)) ? -1 : 1)
                    .forEach(frame => {
                        console.log(`  ${frame.id}  ${moment(frame.start).format('HH:mm').green} to ${moment(frame.stop).format('HH:mm').green}\t${toHumanReadable(frame.duration)}\t\t${frame.project.magenta}\t\t${(frame.resource.type + ' #' + frame.resource.id).blue}`)
                    });
            });
        }
    )
    .catch(error => Cli.error(error));