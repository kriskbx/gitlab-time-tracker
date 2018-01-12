const config = require('./../../src/include/config');
const expect = require('chai').expect;

describe('The config class', () => {
    it('stores data', () => {
        let Config = new config(),
            data = 'value_' + Math.random(),
            key = 'key_' + Math.random();

        Config.set(key, data);

        expect(Config.get(key)).to.equal(data);
    });

    it('doesnt store data if the value is null or undefined until you force it', () => {
        let Config = new config(),
            data = 'value_' + Math.random(),
            key = 'key_' + Math.random();

        Config.set(key, data);

        Config.set(key, null);
        expect(Config.get(key)).to.equal(data);

        Config.set(key, undefined);
        expect(Config.get(key)).to.equal(data);

        Config.set(key, null, true);
        expect(Config.get(key)).to.equal(null);

        Config.set(key, undefined, true);
        expect(Config.get(key)).to.equal(undefined);
    });

    it('returns moment instances for dates', () => {
        let Config = new config(),
            dates = ['from', 'to'];

        dates.forEach(date => {
            Config.set(date, "2017-08-01");
            expect(typeof Config.get(date).format).to.equal("function");
        });
    });

    it('returns values from objects and falls back to the default', () => {
        let Config = new config(),
            objectsWithDefaults = ['timeFormat'],
            defaults = Object.assign({}, Config.data),
            stringData = 'booze',
            objectData = {
                foo: 'bar',
                baz: 'bar'
            };

        objectsWithDefaults.forEach(key => {
            Config.set(key, objectData);

            expect(Config.get(key, 'foo')).to.equal('bar');
            expect(Config.get(key, 'baz')).to.equal('bar');
            expect(Config.get(key, 'not_a_real_key')).to.equal(defaults[key]);

            Config.set(key, stringData);

            expect(Config.get(key, 'foo')).to.equal('booze');
            expect(Config.get(key, 'baz')).to.equal('booze');
            expect(Config.get(key, 'not_a_real_key')).to.equal('booze');
        });
    });

    it('makes durations human readable', () => {
        let Config = new config(),
            humanReadable = "1d 4h 30m 10s",
            seconds = 45010;

        expect(Config.toHumanReadable(seconds)).to.equal(humanReadable);
    });
});