/*global beforeEach, describe, it, console, afterEach */

describe('Server smoke test', function () {
	'use strict';
	var browser;
	beforeEach(function (done) {
		browser = new this.Browser();
		browser.visit('/log-in').then(function () {
			browser.fill('name', 'admin').fill('password', 'admin').pressButton('#log-in').then(done); //.catch(done);
		});
	});
	afterEach(function () {
		browser.destroy();
	});
	it('loggs the admin in', function () {
		browser.assert.success();
		console.log('logged in as', browser.text('#login-result-name'));
		browser.assert.text('#login-result-name', 'admin');
	});
	describe('Account creation', function () {
		beforeEach(function (done) {
			browser.visit('/util/account').then(done);
		});
		describe('account balance', function () {
			beforeEach(function (done) {
				browser.fill('name', 'gojko').fill('amount', 1000).pressButton('#set-up-account').then(done); //.catch(done);
			});
			it('should set balance', function () {
				browser.assert.success();
				browser.assert.url('/util/account');
				browser.assert.text('#balance', '1000');
				browser.assert.text('#name', 'gojko');
			});
			it('should be able to query balance after setting', function (done) {
				browser.visit('/util/account/gojko').then(function () {
					browser.assert.success();
					browser.assert.text('#balance', '1000');
					browser.assert.text('#name', 'gojko');
				}).catch(this.asyncFail).then(done);
			});
		});
	});
});
