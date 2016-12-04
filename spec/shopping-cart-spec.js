/*global describe, expect, beforeEach, afterEach */
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
				.pressButton('#set-up-account')
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
			browser.assert.text('h1', 'Log in');
			browser.assert.text('.error', 'Cannot use admin account for this action - log in as a normal user.');
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
			browser.assert.text('h1', 'Shopping cart');
			browser.assert.text('#totalPrice', 8);
		}).then(function () {
			return browser.pressButton('#check-out');
		}).then(function () {
			browser.assert.text('h1', 'Checkout request');
			browser.assert.text('#totalPrice', 8);
			browser.assert.text('#numItems', 1);
			browser.assert.text('#message', 'Your items are on the way');
		}).then(function () {
			return browser.visit('/user/me');
		}).then(function () {
			browser.assert.text('#balance', 2);
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
			browser.assert.text('h1', 'Shopping cart');
			browser.assert.text('#totalPrice', 25);
		}).then(function () {
			return browser.pressButton('#check-out');
		}).then(function () {
			browser.assert.text('h1', 'Checkout request');
			browser.assert.text('#message', 'not enough money in account');
		}).then(function () {
			return browser.visit('/user/me');
		}).then(function () {
			browser.assert.text('#balance', 10);
		}).then(done, done.fail);
	});
});
