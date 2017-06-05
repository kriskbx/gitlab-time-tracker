const _ = require('underscore');
const moment = require('moment');
const program = require('commander');

const FrameCollection = require('./models/frameCollection');
const Issue = require('./models/issue');
const MergeRequest = require('./models/mergeRequest');
const Config = require('./include/file-config');
const Cli = require('./include/cli');

program.parse(process.argv);

let config = new Config(process.cwd());
let frames = new FrameCollection(config);

let classes = {
    issue: Issue,
    merge_request: MergeRequest
};
let resources = {
    issue: {},
    merge_request: {}
};

function createTime(frame, time) {
    return new Promise((resolve, reject) => {
        resources[frame.resource.type][frame.resource.id].createTime(Math.ceil(time))
            .then(() => resources[frame.resource.type][frame.resource.id].getNotes())
            .then(() => {
                frame.notes.push({
                    id: resources[frame.resource.type][frame.resource.id].notes[0].id,
                    time: Math.ceil(time)
                });
                frame.write();
                resolve();
            })
            .catch(error => reject(error))
    });
}

// filter out frames, that don't need an update
frames.filter(frame => {
    return !(Math.ceil(frame.duration) === _.reduce(frame.notes, (n, m) => (n + m.time), 0));
});

if(frames.length === 0) process.exit(0);

Cli.bar(`${Cli.process}  Syncing time records...`, frames.length);

frames.forEach((frame, done) => {
    new Promise(resolve => resolve())

    // set resource if it isn't already set
        .then(() => new Promise((resolve, reject) => {
            if (resources[frame.resource.type][frame.resource.id] !== undefined
                && resources[frame.resource.type][frame.resource.id].data.project_id) return resolve();
            resources[frame.resource.type][frame.resource.id] = new classes[frame.resource.type](config, {});
            resources[frame.resource.type][frame.resource.id]
                .make(frame.project, frame.resource.id)
                .then(() => resolve())
                .catch(error => reject(error));
        }))
        .catch(error => Cli.x(`Could not resolve issue/merge_request ${frame.resource.id} on "${frame.project}"`, error))

        // set notes if not already set
        .then(() => new Promise((resolve, reject) => {
            let notes;
            if ((notes = resources[frame.resource.type][frame.resource.id].notes) && notes.length > 0) return;
            resources[frame.resource.type][frame.resource.id]
                .getNotes()
                .then(() => resolve())
                .catch(error => reject(error));
        }))
        .catch(error => Cli.x(`Could not get notes from "${frame.project}"`, error))

        // create note if completely missing
        .then(() => new Promise((resolve, reject) => {
            if (frame.notes.length > 0) return resolve();
            createTime(frame, frame.duration)
                .then(() => {
                    Cli.advance();
                    done();
                })
                .catch(error => reject(error))
        }))
        .catch(error => Cli.error('Could not create time spent.', error))

        // check for mismatches and update times
        .then(() => new Promise((resolve, reject) => {
            let diff = Math.ceil(frame.duration) - parseInt(_.reduce(frame.notes, (n, m) => (n + m.time), 0));
            createTime(frame, diff)
                .then(() => {
                    Cli.advance();
                    done();
                })
                .catch(error => reject(error))
        }))
        .catch(error => Cli.error('Could not create time spent.', error))
});