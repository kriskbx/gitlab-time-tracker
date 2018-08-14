const fs = require('fs');
const Config = require('../include/config');

class dump {
    constructor(config, report) {
        let configCopy = new Config();
        configCopy.data = Object.assign({}, config.data);
        configCopy._dump = config._dump;

        configCopy.set('url', null, true);
        configCopy.set('token', null, true);
        configCopy.set('_createDump', false);
        configCopy.workDir = null;
        configCopy.cache = null;

        fs.writeFileSync(configCopy.get('file'), JSON.stringify(configCopy));
    }

    make() {
    }

    toStdOut() {
    }

    toFile(file, resolve) {
        if (resolve) resolve();
    }
}

module.exports = dump;