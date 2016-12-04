/*global require, console, __dirname*/
var express = require('express'),
	session = require('express-session'),
	uuid = require('uuid'),
	handlebars = require('express-handlebars'),
	PaymentProcessor = require('../payment/processor'),
	initializeServer = function () {
		'use strict';
		var templateEngine  = handlebars .create({
					defaultLayout: 'main',
					extname: '.hbs',
					layoutsDir: __dirname + '/views/layouts',
					partialsDir: __dirname + '/views/partials',
					helpers: {
						timestamp: function () {
							return new Date();
						}
					}
				}).engine,
			bodyParser = require('body-parser'),
			app = express(),
			server,
			accountRepository = function (req) {
				return (req.session.accounts = req.session.accounts || {});
			},
			itemRepository = function (req) {
				return (req.session.items = req.session.items || {});
			},
			cartRepository = function (req) {
				return (req.session.cart = req.session.cart || []);
			},
			currentAccount = function (req) {
				return req.session.loggedInAccount;
			},
			requireAdmin = function (req, res, next) {
				if (req.session && req.session.admin) {
					next();
				} else {
					res.render('log-in', {error: 'Admin access required'});
				}
			},
			requireNormalUser = function (req, res, next) {
				if (req.session && !req.session.admin) {
					next();
				} else {
					res.render('log-in', {error: 'Cannot use admin account for this action - log in as a normal user.'});
				}
			},
			paymentProcessor = new PaymentProcessor(),
			setUpAccountLocals = function (req, res) {
				if (req.session.admin) {
					res.locals.currentAccount = 'admin';
				} else {
					res.locals.currentAccount = req.session && req.session.loggedInAccount;
				}
				res.locals.isAdmin = req.session.admin;
			};

	app.engine('.hbs', templateEngine);
	app.set('view engine', '.hbs');
	app.set('views', __dirname + '/views');
	app.use(session({secret: 'cookiesecret', resave: false, saveUninitialized: true}));
	app.use(express.static(__dirname + '/public'));
	app.all('/util/*', requireAdmin);
	app.all('/shopping-cart/*', requireNormalUser);
	app.all('/shopping-cart', requireNormalUser);
	app.all('/user/*', requireNormalUser);
	app.use(bodyParser.urlencoded({ extended: false }));

	app.use(function (req, res, next) {
		setUpAccountLocals(req, res);
		next();
	});

	app.get('/smoke', function (req, res) {
		res.send('Test Server running happily ' + new Date());
	});
	app.get('/', function (req, res) {
		res.render('home', {items: itemRepository(req)});
	});

	/* account management */
	app.post('/util/account', function (req, res) {
		var name = req.body.name,
				balance = parseFloat(req.body.amount),
				accounts = accountRepository(req);
		if (!balance || isNaN(balance)) {
			res.render('account-setup', {error: 'Balance must be a number', name: name});
		} else if (!name) {
			res.render('account-setup', {error: 'Account name is mandatory'});
		} else {
			accounts[name] = balance;
			res.render('account', { name: name, balance: balance });
		}
	});
	app.get('/util/account', function (req, res) {
		res.render('account-setup');
	});
	app.get('/util/accounts', function (req, res) {
		res.render('accounts', {accounts: accountRepository(req) });
	});
	app.get('/util/account/:name', function (req, res) {
		var name = req.params.name;
		res.render('account', {name: name, balance: accountRepository(req)[name]});
	});
	/* item management */
	app.post('/util/item', function (req, res) {
		var name = req.body.name,
				price = req.body.price,
				description = req.body.description,
				items = itemRepository(req),
				itemId = uuid.v4();
		if (!price || isNaN(price)) {
			res.render('item-setup', {error: 'Price must be numeric'});
		} else if (!name) {
			res.render('item-setup', {error: 'Item name is mandatory'});
		} else {
			items[itemId] = {name: name, description: description, price: price, id: itemId};
			console.log('post item', name, itemId);
			res.render('item', items[itemId]);
		}
	});
	app.get('/util/item', function (req, res) {
		res.render('item-setup');
	});
	app.get('/item/:id', function (req, res) {
		var id = req.params.id;
		res.render('item', itemRepository(req)[id]);
	});
	/* logging in */
	app.post('/log-in', function (req, res) {
		var name = req.body.name,
			password = req.body.password,
			resultArgs;
		if (name === 'admin' && password === 'admin') {
			req.session.admin = true;
			req.session.loggedInAccount = false;
			resultArgs = {name: 'admin'};
		} else if (name === password && accountRepository(req)[name]) {
			req.session.admin = false;
			req.session.loggedInAccount = name;
			resultArgs = {name: name, balance: accountRepository(req)[name]};
		} else {
			resultArgs = {error: 'Wrong password'};
		}
		setUpAccountLocals(req, res);
		res.render('log-in', resultArgs);
	});
	app.post('/log-out', function (req, res) {
		req.session.admin = false;
		cartRepository(req).splice(0);
		req.session.loggedInAccount = false;
		res.redirect('/log-in');
	});
	app.get('/log-in', function (req, res) {
		res.render('log-in');
	});

	/* current user */
	app.post('/user/topup', function (req, res) {
		var name = req.session && req.session.loggedInAccount,
			card = req.body.card,
			amount = parseFloat(req.body.amount),
			error,
			paymentResult;

		if (!card) {
			error = 'Please provide a card number';
		} else if (!amount || isNaN(amount)) {
			error = 'Amount is invalid';
		} else {
			paymentResult = paymentProcessor.process({card: card, amount: amount});
			if (paymentResult.success) {
				accountRepository(req)[name] += amount;
			}
		}
		res.render('account', {error: error, paymentResult: paymentResult, name: name, balance: accountRepository(req)[name]});
	});
	app.get('/user/me', function (req, res) {
		var name = req.session && req.session.loggedInAccount;
		res.render('account', {name: name, balance: accountRepository(req)[name]});
	});
	/* shopping card management */
	app.post('/shopping-cart', function (req, res) {
		var itemId = req.body.itemId,
				cart = cartRepository(req);
		cart.push(itemId);
		console.log('post shopping cart', itemId);
		res.redirect('/shopping-cart');
	});
	app.post('/shopping-cart/clear', function (req, res) {
		var cart = cartRepository(req);
		cart.splice(0);
		console.log('clear shopping cart');
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
		console.log(cartRepository(req), items);
		res.render('shopping-cart', {items: items, totalPrice: totalPrice});
	});

	server = app.listen(3000, function () {
		var host = server.address().address,
				port = server.address().port;
		console.log('Example app listening at http://%s:%s', host, port);
	});
};

initializeServer();
