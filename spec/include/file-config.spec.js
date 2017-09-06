const tempfile = require('tempfile');
const config = require('./../../src/include/file-config');
const expect = require('chai').expect;

describe('The file config class', () => {
    it('it takes and stores the current working directory', () => {
        let workDir = tempfile(),
            Config = new config(workDir);

        expect(Config.workDir).to.equal(workDir);
    });
});