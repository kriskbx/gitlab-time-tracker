const fs = require('fs');
const path = require('path');
const config = require('./config');
const yaml = require('read-yaml');
const Hashids = require('hashids');
const hashids = new Hashids();

const globalConfigDir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] + '/.gtt';
const globalConfigFile = globalConfigDir + '/config.yml';
const frameDir = globalConfigDir + '/frames';
const cacheDir = globalConfigDir + '/cache';
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
        this.cache = {
            get: this._cacheGet,
            set: this._cacheSet
        };
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
        if (fs.existsSync(this.local)) return true;

        let workDir = this.workDir;
        while (workDir) {
            workDir = path.dirname(workDir);
            if (workDir === '/') workDir = '';
            if (fs.existsSync(workDir + localConfigFile)) {
                this.workDir = workDir;
                return true;
            }
        }
    }

    assertGlobalConfig() {
        if (!fs.existsSync(this.globalDir)) fs.mkdirSync(this.globalDir, '0644', true);
        if (!fs.existsSync(this.frameDir)) fs.mkdirSync(this.frameDir, '0744', true);
        if (!fs.existsSync(this.cacheDir)) fs.mkdirSync(this.cacheDir, '0744', true);
        if (!fs.existsSync(this.global)) fs.appendFileSync(this.global, '');
    }

    assertLocalConfig() {
        if (!this.localExists()) fs.appendFileSync(this.local, '');
    }

    _cacheGet(key) {
        let file = this.cacheDir + '/' + hashids.encode(key);
        if (!fs.existsSync(file)) return false;

        return JSON.parse(fs.readFileSync(file));
    }

    _cacheSet(key, value) {
        let file = this.cacheDir + '/' + hashids.encode(key);
        if (fs.existsSync(file)) fs.unlinkSync(file);
        fs.appendFileSync(file, JSON.stringify(value));

        return value;
    }

    get cacheDir() {
        return cacheDir;
    }

    get frameDir() {
        return frameDir;
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