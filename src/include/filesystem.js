const _ = require('underscore');
const fs = require('fs');
const path = require('path');
const open = require('open');
const find = require('find-in-files');
const child_process = require('child_process');

class filesystem {
    static find(pattern, dir) {
        return new Promise((resolve, reject) => {
            find.find(pattern, dir)
                .then(results => resolve(_.keys(results)))
                .catch(error => reject(error));
        });
    }

    static exists(file) {
        return fs.existsSync(file);
    }

    static remove(file) {
        return fs.unlinkSync(file);
    }

    static open(file) {
        let editor = process.env.VISUAL;

        if (editor || (editor = process.env.EDITOR)) {
            return child_process.spawn(editor, [file], {
                stdio: 'inherit'
            });
        } else {
            return (async () => await open(file))().catch(e => console.error(e));
        }
    }

    static join(...args) {
        return path.join(...args);
    }

    static newest(dir) {
        return _.max(fs.readdirSync(dir), file => (fs.statSync(path.join(dir, file)).ctime));
    }

    static readDir(dir) {
        return fs.readdirSync(dir);
    }
}

module.exports = filesystem;
