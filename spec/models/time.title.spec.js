const moment = require('moment');
const Config = require('../../src/include/config');
const Time = require('./../../src/models/time');
const issue = require('../../src/models/issue');
const mergeRequest = require('../../src/models/mergeRequest');
const expect = require('chai').expect;

describe('time class', () => {
    it('Returns title of parent Issue', () => {
        const config = new Config();
        const parent = new issue(config, {title: "Test title"})
        const time = new Time('1h', moment(), {}, parent,  config);

        expect(time.title).to.be.equal("Test title");
    });

    it('Returns title of parent MergeRequest', () => {
        const config = new Config();
        const parent = new mergeRequest(config, {title: "Test title"})
        const time = new Time('1h', moment(), {}, parent,  config);

        expect(time.title).to.be.equal("Test title");
    });

    it('Returns Null for missed title or parent', () => {
        const config = new Config();
        const parent = new mergeRequest(config, {});
        let time;
        time = new Time('1h', moment(), {}, parent,  config);
        expect(time.title).to.be.equal(null);

        time = new Time('1h', moment(), {}, null,  config);
        expect(time.title).to.be.equal(null);
    });
});

