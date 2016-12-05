/*global module */
module.exports = function setUpShoppingCart(app, cartRepository, accountRepository, itemRepository) {
	'use strict';
	var MAX_CART_COST = 3000,
		currentAccount = function (req) {
			return req.session.loggedInAccount;
		},
		sumOfPrices = function (items) {
			return items.reduce(function (subtotal, item) {
				return subtotal + (parseFloat(item.price) || 0);
			}, 0);
		},
		cartItems = function (req) {
			var itemById = function (id) {
					return itemRepository(req)[id];
				},
				items = cartRepository(req).map(itemById);
			items.totalPrice = sumOfPrices(items);
			return items;
		},
		showShoppingCart = function (req, res, errorMessage) {
			var items = cartItems(req);
			res.render('shopping-cart', {items: items, totalPrice: items.totalPrice, numItems: items.length, error: errorMessage});
		};

	app.get('/shopping-cart', function (req, res) {
		showShoppingCart(req, res, '');
	});


	app.post('/shopping-cart', function (req, res) {
		var itemId = req.body.itemId,
			cart = cartRepository(req),
			newItemPrice = parseFloat(itemRepository(req)[itemId].price);
		if (cartItems(req).totalPrice + newItemPrice <= MAX_CART_COST) {
			cart.push(itemId);
			showShoppingCart(req, res);
		} else {
			showShoppingCart(req, res, 'You can only order up to ' + MAX_CART_COST);
		}
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
		totalPrice = sumOfPrices(items),
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


};
