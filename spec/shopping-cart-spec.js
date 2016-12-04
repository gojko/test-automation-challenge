/*global describe, beforeEach, afterEach, require, it, expect */
var Browser = require('zombie');

describe('Shopping Cart', function () {
	'use strict';
	var browser,
		cheapBookItemId,
		expensiveBookItemId;

	beforeEach(function (done) {
		Browser.localhost('example.com', 3000);
		browser = new Browser();
		browser.visit('/log-in').then(function () {
			return browser.fill('name', 'admin')
				.fill('password', 'admin')
				.pressButton('#log-in');
		}).then(function () {
			return browser.visit('/util/account');
		}).then(function () {
			return browser.fill('name', 'timmy')
				.fill('amount', 10)
				.pressButton('#set-up-account');
		}).then(function () {
			return browser.visit('/util/item');
		}).then(function () {
			return browser.fill('name', 'Cheap book')
				.fill('price', 8)
				.fill('description', 'A very cheap book')
				.pressButton('#set-up-item');
		}).then(function () {
			cheapBookItemId = browser.text('#item-id');
		}).then(function () {
			return browser.visit('/util/item');
		}).then(function () {
			return browser.fill('name', 'Expensive book')
				.fill('price', 25)
				.fill('description', 'A very expensive book')
				.pressButton('#set-up-item');
		}).then(function () {
			expensiveBookItemId = browser.text('#item-id');
		}).then(done, done.fail);
	});
	afterEach(function () {
		browser.destroy();
	});
	it('does not allow admins to check out', function (done) {
		browser.visit('/item/' + cheapBookItemId).then(function () {
			return browser.pressButton('#add-to-cart');
		}).then(function () {
			expect(browser.text('h1')).toEqual('Log in');
			expect(browser.text('#error')).toEqual('Cannot use admin account for this action - log in as a normal user.');
		}).then(done, done.fail);
	});
	it('allows users to check out if they have enough money', function (done) {
		browser.visit('/log-in').then(function () {
			return browser.fill('name', 'timmy')
				.fill('password', 'timmy')
				.pressButton('#log-in');
		}).then(function () {
			return browser.visit('/item/' + cheapBookItemId);
		}).then(function () {
			return browser.pressButton('#add-to-cart');
		}).then(function () {
			expect(browser.text('h1')).toEqual('Shopping cart');
			expect(browser.text('#totalPrice')).toEqual('8');
		}).then(function () {
			return browser.pressButton('#check-out');
		}).then(function () {
			expect(browser.text('h1')).toEqual('Checkout request');
			expect(browser.text('#totalPrice')).toEqual('8');
			expect(browser.text('#numItems')).toEqual('1');
			expect(browser.text('#message')).toEqual('Your items are on the way');
		}).then(function () {
			return browser.visit('/user/me');
		}).then(function () {
			expect(browser.text('#balance')).toEqual('2');
		}).then(done, done.fail);
	});
	it('prevents users from checking out if they do not have enough money', function (done) {
		browser.visit('/log-in').then(function () {
			return browser.fill('name', 'timmy')
				.fill('password', 'timmy')
				.pressButton('#log-in');
		}).then(function () {
			return browser.visit('/item/' + expensiveBookItemId);
		}).then(function () {
			return browser.pressButton('#add-to-cart');
		}).then(function () {
			expect(browser.text('h1')).toEqual('Shopping cart');
			expect(browser.text('#totalPrice')).toEqual('25');
		}).then(function () {
			return browser.pressButton('#check-out');
		}).then(function () {
			expect(browser.text('h1')).toEqual('Checkout request');
			expect(browser.text('#message')).toEqual('not enough money in account');
		}).then(function () {
			return browser.visit('/user/me');
		}).then(function () {
			expect(browser.text('#balance')).toEqual('10');
		}).then(done, done.fail);
	});
});
