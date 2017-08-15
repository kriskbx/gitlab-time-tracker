const fs = require('fs');
const path = require('path');
const config = require('./config');
const yaml = require('read-yaml');
const hash = require('hash-sum');
const Fs = require('./filesystem');
const extend = require('util')._extend;

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
            set: this._cacheSet,
            dir: this.cacheDir
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
            let global = yaml.sync(this.global, {});
            let local = yaml.sync(this.local, {});
            return extend(global, local);
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
            if (fs.existsSync(Fs.join(workDir, this.localConfigFile))) {
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
        let file = Fs.join(this.dir, hash(key));
        if (!fs.existsSync(file)) return false;

        return JSON.parse(fs.readFileSync(file));
    }

    _cacheSet(key, value) {
        let file = Fs.join(this.dir, hash(key));
        if (fs.existsSync(file)) fs.unlinkSync(file);
        fs.appendFile(file, JSON.stringify(value), () => {
        });

        return value;
    }

    get localConfigFile() {
        return '.gtt.yml';
    }

    get globalDir() {
        return Fs.join(process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'], '.gtt');
    }

    get frameDir() {
        return Fs.join(this.globalDir, 'frames');
    }

    get cacheDir() {
        return Fs.join(this.globalDir, 'cache')
    }

    get global() {
        return Fs.join(this.globalDir, 'config.yml');
    }

    get local() {
        return Fs.join(this.workDir, this.localConfigFile);
    }
}

module.exports = fileConfig;