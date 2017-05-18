const Base = require('./base');
const Frame = require('./frame');
const Fs = require('./../include/filesystem');

class frameCollection extends Base {
    constructor(config) {
        super(config);

        this.frames = Fs.readDir(config.frameDir);
    }

    forEach(iterator) {
        return this.parallel(this.frames, (file, done) => {
            let frame = Frame.fromFile(this.config, Fs.join(this.config.frameDir, file));
            if (frame.stop === false) return done();

            iterator(frame, done);
        });
    }

    get length() {
        return this.frames.length;
    }
}

module.exports = frameCollection;