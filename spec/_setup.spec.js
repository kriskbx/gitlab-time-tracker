const sinon = require('sinon');
const chai = require('chai');

beforeEach(function () {
    this.sandbox = sinon.sandbox.create()
});

afterEach(function () {
    this.sandbox.restore()
});