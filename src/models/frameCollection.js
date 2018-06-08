const Base = require('./base');
const Frame = require('./frame');
const Fs = require('./../include/filesystem');

class frameCollection extends Base {
    constructor(config) {
        super(config);

        this.frames =
            Fs.readDir(config.frameDir)
                .map(file => {
                    try {
                        return Frame.fromFile(this.config, Fs.join(this.config.frameDir, file));
                    } catch (e) {
                        console.log(e);
                        throw `Error parsing frame file: ${file}`
                    }
                })
                .filter(frame => frame);
    }

    sort(func) {
        this.frames.sort(func);

        return this;
    }

    filter(func) {
        let arr = [];

        this.frames.forEach(frame => {
            if (frame.stop === false) {
                return false;
            }

            if (func(frame)) {
                arr.push(frame);
            }
        });

        this.frames = arr;

        return this;
    }

    forEach(iterator) {
        let promise = this.parallel(this.frames, iterator);

        return promise;
    }

    get length() {
        return this.frames.length;
    }
}

module.exports = frameCollection;