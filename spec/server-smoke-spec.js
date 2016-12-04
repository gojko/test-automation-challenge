/*global beforeEach, describe, it, console, afterEach, expect, require */

var Browser = require('zombie');


describe('Server smoke test', function () {
	'use strict';
	var browser;

	beforeEach(function (done) {
		Browser.localhost('example.com', 3000);
		browser = new Browser();
		browser.visit('/log-in').then(function () {
			return browser.fill('name', 'admin')
				.fill('password', 'admin')
				.pressButton('#log-in');
		}).then(done, done.fail);
	});
	afterEach(function () {
		browser.destroy();
	});
	it('logs the admin in', function () {
		console.log('logged in as', browser.text('#login-result-name'));
		expect(browser.text('#login-result-name')).toEqual('admin');
	});
	describe('Account creation', function () {
		beforeEach(function (done) {
			browser.visit('/util/account').then(done, done.fail);
		});
		describe('account balance', function () {
			beforeEach(function (done) {
				browser.fill('name', 'gojko')
				.fill('amount', 1000)
				.pressButton('#set-up-account')
				.then(done, done.fail);
			});
			it('should set balance', function () {
				expect(browser.url).toEqual('http://example.com/util/account');
				expect(browser.text('#balance')).toEqual('1000');
				expect(browser.text('#name')).toEqual('gojko');
			});
			it('should be able to query balance after setting', function (done) {
				browser.visit('/util/account/gojko').then(function () {
					expect(browser.text('#balance')).toEqual('1000');
					expect(browser.text('#name')).toEqual('gojko');
				}).then(done, done.fail);
			});
		});
	});
});
