const _ = require('underscore');
const program = require('commander');
const colors = require('colors');
const moment = require('moment');

const Frame = require('./models/frame');
const Config = require('./include/file-config');
const Time = require('./models/time');
const Fs = require('./include/filesystem');

program.parse(process.argv);

let config = new Config(__dirname);

let frames = {};
let times = {};

function toHumanReadable(input) {
    return Time.toHumanReadable(Math.ceil(input), config.get('hoursPerDay'), config.get('timeFormat'));
}

Fs.readDir(config.frameDir).forEach(file => {
    let frame = Frame.fromFile(config, Fs.join(config.frameDir, file));
    if (frame.stop === false) return;
    let date = moment(frame.start).format('YYYY-MM-DD');

    if (!frames[date]) frames[date] = [];
    if (!times[date]) times[date] = 0;

    frames[date].push(frame);
    times[date] += Math.ceil(frame.duration);
});

Object.keys(frames).sort().forEach(date => {
    if (!frames.hasOwnProperty(date)) return;

    console.log(`${moment(date).format('MMMM Do YYYY')} (${toHumanReadable(times[date])})`.green);
    frames[date]
        .sort((a, b) => moment(a.start).isBefore(moment(b.start)) ? -1 : 1)
        .forEach(frame => {
            console.log(`  ${frame.id}  ${moment(frame.start).format('HH:mm').green} to ${moment(frame.stop).format('HH:mm').green}\t${toHumanReadable(frame.duration)}\t\t${frame.project.magenta}\t\t${(frame.resource.type + ' #' + frame.resource.id).blue}`)
        });
});