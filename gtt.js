#!/usr/bin/env node

const version = '1.0.1';
const program = require('commander');

program
    .version(version)
    .command('edit', 'edit the configuration file in your default editor')
    .command('report [project] [ids]', 'generate a report for the given project and issues')
    .parse(process.argv);