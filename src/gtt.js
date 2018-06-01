#!/usr/bin/env node

const version = '1.7.7';
const program = require('commander');

program
    .version(version)
    .command('start [project] [id]', 'start monitoring time for the given project and resource id')
    .command('create [project] [title]', 'start monitoring time for the given project and create a new issue or merge request with the given title')
    .command('status', 'shows if time monitoring is running')
    .command('stop', 'stop monitoring time')
    .command('resume [project]', 'resume monitoring time for last stopped record')
    .command('cancel', 'cancel and discard active monitoring time')
    .command('log', 'log recorded time records')
    .command('sync', 'sync local time records to GitLab')
    .command('edit [id]', 'edit time record by the given id')
    .command('delete [id]', 'delete time record by the given id')
    .command('report [project] [ids]', 'generate a report for the given project and issues')
    .command('config', 'edit the configuration file in your default editor')
    .parse(process.argv);
