const fs = require('fs');
const path = require('path');
const os = require("os");
const xdgBaseDir = require('xdg-basedir');
const config = require('./config');
const yaml = require('read-yaml');
const hash = require('hash-sum');
const Fs = require('./filesystem');

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
        this._dump = {};
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
            let local = Object.assign({extend: true}, yaml.sync(this.local, {}));

            if (local.extend === true) {
                let global = this.parseGlobal();
                local = Object.assign(global ? global : {}, local);
            } else if (local.extend) {
                try {
                    local = Object.assign(yaml.sync(local.extend, {}), local);
                } catch (e) {
                    console.log(`Error parsing configuration: "${local.extend}"`);
                    process.exit(1);
                }
            }

            return local;
        } catch (e) {
            console.log(`Error parsing configuration: "${this.local}"`);
            process.exit(1);
        }
    }

    localExists() {
        if (fs.existsSync(this.local)) return true;

        let root = (os.platform() === "win32") ? process.cwd().split(path.sep)[0] + "\\" : "/";
        let workDir = this.workDir;
        while (workDir) {
            workDir = path.dirname(workDir);
            if (workDir === root) workDir = '';
            if (fs.existsSync(Fs.join(workDir, this.localConfigFile))) {
                this.workDir = workDir;
                return true;
            }
        }
    }

    assertGlobalConfig() {
        if(!fs.existsSync(this.globalDir) && fs.existsSync(this.oldGlobalDir)) {
            fs.renameSync(this.oldGlobalDir, this.globalDir);
        }

        if (!fs.existsSync(this.globalDir)) fs.mkdirSync(this.globalDir, '0750', true);
        if (!fs.existsSync(this.frameDir)) fs.mkdirSync(this.frameDir, '0750', true);
        if (!fs.existsSync(this.cacheDir)) fs.mkdirSync(this.cacheDir, '0750', true);
        if (!fs.existsSync(this.global)) fs.appendFileSync(this.global, '');
    }

    assertLocalConfig() {
        if (!this.localExists()) fs.appendFileSync(this.local, '');
    }

    _cacheDelete(key) {
        let file = Fs.join(this.dir, hash(key));
        if (!fs.existsSync(file)) return false;

        return fs.unlinkSync(file);
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

    get oldGlobalDir() {
        return Fs.join(process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'], '.gtt');
    }

    get globalDir() {
        return Fs.join(xdgBaseDir.data, '.gtt');
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

    setDump(key, value) {
        this._dump[key] = value;
        this.emit('dump-updated');
    }

    getDump(key) {
        return this._dump[key];
    }
}

module.exports = fileConfig;
