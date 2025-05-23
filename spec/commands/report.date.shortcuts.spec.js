const Sinon = require('sinon');
const program = require('commander');
const { assert } = require('chai');
const Config = require('../../src/include/file-config');
const moment = require('moment');
const report = require('../../src/models/report');

describe('Command Report. Date shortcuts', () => {
    it('Shortcut last_month registered', () => {
        /** @type {Sinon.SinonMock} */
        const stub = Sinon.mock(program);

        /** @type {Sinon.SinonSpy} */
        const spy = Sinon.spy(program, 'option');

        stub.expects('parse').throws('Test exception to prevent further execution of gtt-report')
        try {
            require('../../src/gtt-report');
        } catch (e) {}

        try {
            assert(spy.calledWith('--last_month'), 'last_month not registered');
        } finally {
            spy.restore();
            stub.restore();
        }
    });

    it('Shortcut last_month. Sets From and To to Config', () => {
        program.last_month = true;
        program.args = [];
        let configSpy = Sinon.spy(Config.prototype, 'set');

        const reportOriginal = Object.getPrototypeOf(report);
        let reportStub = Sinon.stub().callsFake(() => {
            throw new Error('Test exception to prevent further execution of gtt-report')
        });
        Object.setPrototypeOf(report, reportStub);

        stub = Sinon.mock(program);
        stub.expects('parse').returnsThis();

        try {
            require('../../src/gtt-report');
        } catch (e) {}

        try {
            assert(
                configSpy.calledWith('from', moment().subtract(1, 'months').startOf('month')),
                'From is not set to Config'
            );
            assert(
                configSpy.calledWith('to', moment().subtract(1, 'months').endOf('month')),
                'To is not set to Config'
            );
        } finally {
            configSpy.restore();
            Object.setPrototypeOf(report, reportOriginal);
            delete require.cache[require.resolve('../../src/models/report')];
        }
    })
})
