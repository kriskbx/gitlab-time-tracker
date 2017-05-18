const program = require('commander');
const colors = require('colors');
const moment = require('moment');

const Frame = require('./models/frame');
const Config = require('./include/file-config');
const Cli = require('./include/cli');
const Fs = require('./include/filesystem');

program.parse(process.argv);

let config = new Config(__dirname);

Fs.find(`"stop": false`, config.frameDir)
    .then(frames => {
        if (frames.length === 0) Cli.error('No projects started.');

        frames.forEach(file => {
            let frame = Frame.fromFile(config, file).stopMe();
            console.log(`Stopping project ${frame.project.magenta} ${frame.resource.type.blue} ${('#' + frame.resource.id).blue}, started ${moment(frame.start).fromNow().green} (id: ${frame.id})`);
        });
    })
    .catch(error => Cli.error('Could not read frames.', error));