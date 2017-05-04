const fs = require('fs');
const config = require('./config');

const globalConfigDir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] + '/.gtt';
const globalConfigFile = globalConfigDir + '/config.json';
const localConfigFile = '/.gtt.json';

class fileConfig extends config {
    constructor(workDir) {
        super();
        this.assertGlobalConfig();
        this.workDir = workDir;
        this.data = Object.assign(this.data, this.localExists() ? this.parseLocal() : this.parseGlobal());
    }

    parseGlobal() {
        try {
            return JSON.parse(fs.readFileSync(globalConfigFile, 'utf8'));
        } catch (e) {
            console.log(`Error parsing configuration: "${globalConfigFile}"`);
            process.exit(1);
        }
    }

    parseLocal() {
        try {
            return fs.existsSync(this.workDir + localConfigFile) ? JSON.parse(fs.readFileSync(this.workDir + localConfigFile), 'utf8') : {};
        } catch (e) {
            console.log(`Error parsing configuration: "${this.workDir + localConfigFile}"`);
            process.exit(1);
        }
    }

    localExists() {
        return fs.existsSync(this.local);
    }

    assertGlobalConfig() {
        if (!fs.existsSync(this.globalDir)) fs.mkdirSync(this.globalDir, '0644', true);
        if (!fs.existsSync(this.global)) fs.appendFileSync(this.global, '{}');
    }

    assertLocalConfig() {
        if (!this.localExists()) fs.appendFileSync(this.local, '{}');
    }

    get globalDir() {
        return globalConfigDir;
    }

    get global() {
        return globalConfigFile;
    }

    get local() {
        return this.workDir + localConfigFile;
    }
}

module.exports = fileConfig;