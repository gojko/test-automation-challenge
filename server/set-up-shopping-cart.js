/*global module */
module.exports = function setUpShoppingCart(app, cartRepository, accountRepository, itemRepository) {
	'use strict';
	var currentAccount = function (req) {
		return req.session.loggedInAccount;
	};
	app.post('/shopping-cart', function (req, res) {
		var itemId = req.body.itemId,
		cart = cartRepository(req);
		cart.push(itemId);
		res.redirect('/shopping-cart');
	});
	app.post('/shopping-cart/clear', function (req, res) {
		var cart = cartRepository(req);
		cart.splice(0);
		res.redirect('/shopping-cart');
	});
	app.post('/shopping-cart/check-out', function (req, res) {
		var cart = cartRepository(req),
		itemById = function (id) {
			return itemRepository(req)[id];
		},
		items = cartRepository(req).map(itemById),
		totalPrice = items.reduce(function (subtotal, item) {
			return subtotal + (parseFloat(item.price) || 0);
		}, 0),
		accounts = accountRepository(req),
		accountName = currentAccount(req);
		if (!cart.length) {
			res.render('checkout-request', {error: 'your cart is empty'});
		} else if (!accountName) {
			res.render('checkout-request', {error: 'not logged in'});
		} else if (accounts[accountName] < totalPrice) {
			res.render('checkout-request', {error: 'not enough money in account'});
		} else {
			accounts[accountName] -= totalPrice;
			cart.splice(0);
			res.render('checkout-request', {totalPrice: totalPrice, numItems: items.length});
		}
	});

	app.get('/shopping-cart', function (req, res) {
		var itemById = function (id) {
			return itemRepository(req)[id];
		},
		items = cartRepository(req).map(itemById),
		totalPrice = items.reduce(function (subtotal, item) {
			return subtotal + (parseFloat(item.price) || 0);
		}, 0);
		res.render('shopping-cart', {items: items, totalPrice: totalPrice});
	});

};
