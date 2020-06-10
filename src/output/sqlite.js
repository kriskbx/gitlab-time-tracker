const _ = require('underscore');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const Base = require('./base');
const Cli = require('./../include/cli');


/*
 * Constants
 */
const TABLE_ISSUES = 'issues';
const TABLE_MERGE_REQUESTS = 'merge_requests';
const TABLE_TIMES = 'times';
const TABLE_LABELS = 'labels';
const TABLE_LABEL_GROUP = 'label_groups';
const TABLE_MILESTONES = 'milestones';

const COLUMNS = {
    [TABLE_ISSUES]: 'issueColumns',
    [TABLE_MERGE_REQUESTS]: 'mergeRequestColumns',
    [TABLE_TIMES]: 'recordColumns'
};


/**
 * Returns the SQLite type for a specific column name.
 * Note that this is a general mapper, i.e. there is no distinction between table differences.
 *
 * @param columnName
 * @returns {string}
 */
function getGeneralColumnType(columnName) {
    if(['id'].includes(columnName)) {
        return 'INTEGER PRIMARY KEY';
    }

    if(['iid', 'project_id', 'gid'].includes(columnName)) {
        return 'INTEGER NOT NULL';
    }

    if(['spent', 'total_spent', 'total_estimate', 'time'].includes(columnName)) {
        return 'REAL';
    }

    if(['date', 'updated_at', 'created_at', 'due_date'].includes(columnName)) {
        return 'DATE';
    }

    if(columnName === 'label_group') {
        return `REFERENCES ${TABLE_LABEL_GROUP}(gid)`;
    }

    if(columnName === 'label_id') {
        return `REFERENCES ${TABLE_LABELS}(id)`;
    }

    if(columnName === 'milestone') {
        return `REFERENCES ${TABLE_MILESTONES}(id)`;
    }

    // default:
    return 'TEXT';
}


/**
 * Data required to create a SQLite table and fill with records.
 */
class Table {

    /**
     *
     * @param name of the Table
     * @param columns Array of column names
     * @param records Array of records to insert
     */
    constructor(name, columns, records) {
        this.name = name;
        this.columns = columns;
        this.records = records;
    }
}

/**
 * Promise-based abstraction of the SQLite database driver
 */
class SqliteDatabaseAbstraction {

    constructor(file) {
        this.file = file;
    }

    /**
     * Opens the SQLite database in write mode
     *
     * @returns {Promise<any>}
     */
    open() {
        return new Promise((resolve, reject) => {
            this.database = new sqlite3.Database(this.file, err => err? reject(err) : resolve());
        });
    }

    /**
     * Closes the SQLite database before shutdown
     *
     * @returns {Promise<any>}
     */
    close() {
        return new Promise((resolve, reject) => {
            this.database.close(err => err? reject(err) : resolve());
        });
    }

    /**
     * Creates a table and inserts the records.
     *
     * @param table
     * @returns {Promise<void>}
     */
    async buildTable(table) {
        const cols = table.columns.map(name => [name, getGeneralColumnType(name)]);
        await this.createTable(table.name, cols);

        await this.insertRecords(table);
    }

    /**
     * Inserts multiple records according to a column list into a table.
     *
     * @param table
     * @returns {Promise<any>}
     */
    insertRecords(table) {
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO ${table.name} VALUES (${table.columns.map(() => '?').join(', ')})`;
            const stmt = this.database.prepare(query);
            for (const record of table.records) {
                stmt.run(...record)
            }

            stmt.finalize((err) => {
                if(err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Creates a new table in the SQLite Database
     *
     * @param name
     * @param columnNameTypes
     * @returns {Promise<void>}
     */
    async createTable(name, columnNameTypes) {
        await new Promise((resolve, reject) => {
            this.database.run(`DROP TABLE IF EXISTS ${name}`, (err) => err? reject(err): resolve());
        });

        await new Promise((resolve, reject) => {
            const columns = columnNameTypes.map(col => `${col[0]} ${col[1]}`).join(', ');
            this.database.run(`CREATE TABLE ${name} (${columns})`, (err) => err? reject(err): resolve());
        });
    }

    /**
     * Creates a new view in the SQLite Database
     * @returns {Promise<void>}
     */
    async createView(view) {
        await new Promise((resolve, reject) => {
            this.database.run(`DROP VIEW IF EXISTS ${view[0]}`, (err) => err? reject(err): resolve());
        });

        await new Promise((resolve, reject) => {
            this.database.run(`CREATE VIEW ${view[0]} AS ${view[1]}`, (err) => err? reject(err): resolve());
        });
    }
}

/**
 * sqlite output
 */
class Sqlite extends Base {

    constructor(config, report) {
        super(config, report);
        this.tables = new Map();
        this.stats = new Map();

        this.initSpecialTables();
    }

    /**
     * Initializes special tables like labels or milestones, which are extracted from the output tables.
     */
    initSpecialTables() {
        const issueColumns = this.config.get(COLUMNS[TABLE_ISSUES]);
        const mergeRequestColumns = this.config.get(COLUMNS[TABLE_MERGE_REQUESTS]);
        if(issueColumns.includes('labels') || mergeRequestColumns.includes('labels')) {
            /**
             * @type {Map<string, number>} Maps Labels to label group ids.
             */
            this.labels = new Map();
            this.labelGroupSerial = 0;
            this.labelsSerial = 0;

            this.tables.set(TABLE_LABELS, new Table(
                TABLE_LABELS,
                ['id', 'name'],
                []
            ));
            this.tables.set(TABLE_LABEL_GROUP, new Table(
                TABLE_LABEL_GROUP,
                ['gid', 'label_id'],
                []
            ));
        }

        if(issueColumns.includes('milestone') || mergeRequestColumns.includes('milestone')) {
            /**
             * @type {Map<string, number>} Maps Milestones to ids
             */
            this.milestones = new Map();
            this.milestonesSerial = 0;

            this.tables.set(TABLE_MILESTONES, new Table(
                TABLE_MILESTONES,
                ['id', 'name'],
                []
            ));
        }
    }

    makeStats() {
        this.stats.set('view_time_per_user', 'SELECT user, SUM(time) FROM times GROUP BY user');

        // General Time Tracking summaries for some columns over multiple tables
        const queries = [];
        const fieldTables = [TABLE_ISSUES, TABLE_TIMES];
        const columns = ['total_estimate', 'total_spent', 'spent'];

        for(const column of columns) {
            const subTableQueries = fieldTables
                .filter(table => this.config.get(COLUMNS[table]).includes(column))
                .map(table => `SELECT ${column} FROM ${table}`)
                .join(' UNION ALL ');

            if(subTableQueries.length > 0) {
                queries.push(`SELECT '${column}', SUM(${column}) FROM (${subTableQueries})`);
            }
        }

        if(queries.length > 0) {
            this.stats.set('view_time_stats', queries.join(' UNION ALL '));
        }
    }

    makeIssues() {
        const table = this.makeTable(TABLE_ISSUES, this.report.issues);
        const columns = this.config.get(COLUMNS[TABLE_ISSUES]);

        if(columns.includes('milestone')) {
            table.records.forEach(record => {
                const columnIndex = columns.indexOf('milestone');
                record[columnIndex] = this.parseMilestone(record[columnIndex]);
            });
        }

        if(columns.includes('labels')) {
            columns.push('label_group');

            table.records.forEach(record => {
                record[columns.indexOf('label_group')] = this.parseLabelList(record[columns.indexOf('labels')]);
            });
        }
    }

    makeMergeRequests() {
        const table = this.makeTable(TABLE_MERGE_REQUESTS, this.report.mergeRequests);
        const columns = this.config.get(COLUMNS[TABLE_MERGE_REQUESTS]);

        if(columns.includes('labels')) {
            columns.push('label_group');

            table.records.forEach(record => {
                record[columns.indexOf('label_group')] = this.parseLabelList(record[columns.indexOf('labels')]);
            });
        }
    }

    makeRecords() {
        this.makeTable(TABLE_TIMES, this.times);
    }

    makeTable(name, data) {
        const columns = this.config.get(COLUMNS[name]);
        const preparedData = data.map(record => this.prepare(record, columns));

        const table = new Table(name, columns, preparedData);
        this.tables.set(name,table);
        return table;
    }

    /**
     * Creates a normalized table for milestones.
     *
     * @param milestone {string | number} Name of the milestone (or 0 if empty)
     * @returns {number | null} ID of the milestone record.
     */
    parseMilestone(milestone) {
        if(milestone === 0) {
            return null;
        }

        return this.getOrCreateMilestoneId(milestone);
    }


    /**
     * Creates a normalized labels structure from a labels comma list.
     *
     * @param labels {Array<string>}
     * @returns {number | null} id of the new label group
     */
    parseLabelList(labels) {
        const serial = this.labelGroupSerial++;

        if(!labels) {
            return null;
        }

        const records = labels
            .map(label => this.getOrCreateLabelId(label))
            .map(labelId => [serial, labelId]);
        this.tables.get(TABLE_LABEL_GROUP).records.push(...records);

        return serial;
    }

    /**
     * Gets the id of a label (and create it, if it not yet exists)
     *
     * @param name
     * @returns {number} id of the label
     */
    getOrCreateLabelId(name) {
        if(this.labels.has(name)) {
            return this.labels.get(name);
        }

        const serial = this.labelsSerial++;
        this.tables.get('labels').records.push([serial, name]);
        this.labels.set(name, serial);
        return serial;
    }


    /**
     * Creates a Milestone (or fetches the existing one) and returns the ID.
     *
     * @param milestone {string}
     * @returns {number}
     */
    getOrCreateMilestoneId(milestone) {
        if(this.milestones.has(milestone)) {
            return this.milestones.get(milestone);
        }

        const serial = this.milestonesSerial++;
        this.tables.get('milestones').records.push([serial, milestone]);
        this.milestones.set(milestone, serial);
        return serial;
    }


    toFile(file, resolve) {
        this.db = new SqliteDatabaseAbstraction(file);
        this.provisionDatabase()
             .then(() => resolve())
             .catch((err) => Cli.error("SQLITE: Error while building the database", err));
    }

    async provisionDatabase() {
        await this.db.open();

        for(const table of this.tables.values()) {
            await this.db.buildTable(table);
        }

        if (this.config.get('report').includes('stats')) {
            for(const view of this.stats) {
                await this.db.createView(view);
            }
        }

        await this.db.close();
    }

    toStdOut() {
        Cli.error(`Can't output sqlite to std out`);
    }



    /**
     * prepare the given object by converting numeric
     * columns/properties as numbers instead of strings
     * on top of what the parent method already does
     *
     * suboptimally done here to avoid impacts on other outputs
     *
     * @param obj
     * @param columns
     * @returns {Array}
     */
    prepare(obj = {}, columns = []) {
        let formattedObj = super.prepare(obj, columns);
        return formattedObj.map(field => isNaN(field) ? field : Number(field));
    }
}

module.exports = Sqlite;
