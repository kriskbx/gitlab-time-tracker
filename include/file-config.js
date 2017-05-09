const fs = require('fs');
const config = require('./config');
const yaml = require('read-yaml');

const globalConfigDir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] + '/.gtt';
const globalConfigFile = globalConfigDir + '/config.yml';
const localConfigFile = '/.gtt.yml';

/**
 * file config with local and global configuration files
 */
class fileConfig extends config {
    /**
     * construct
     * @param workDir
     */
    constructor(workDir) {
        super();
        this.assertGlobalConfig();
        this.workDir = workDir;
        this.data = Object.assign(this.data, this.localExists() ? this.parseLocal() : this.parseGlobal());
    }

    /**
     * parse the global config
     * @returns {Object}
     */
    parseGlobal() {
        try {
            return yaml.sync(this.global, {});
        } catch (e) {
            console.log(`Error parsing configuration: "${this.global}"`);
            process.exit(1);
        }
    }

    /**
     * parse the local config
     * @returns {Object}
     */
    parseLocal() {
        try {
            return yaml.sync(this.local, {});
        } catch (e) {
            console.log(`Error parsing configuration: "${this.local}"`);
            process.exit(1);
        }
    }

    localExists() {
        return fs.existsSync(this.local);
    }

    assertGlobalConfig() {
        if (!fs.existsSync(this.globalDir)) fs.mkdirSync(this.globalDir, '0644', true);
        if (!fs.existsSync(this.global)) fs.appendFileSync(this.global, '');
    }

    assertLocalConfig() {
        if (!this.localExists()) fs.appendFileSync(this.local, '');
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