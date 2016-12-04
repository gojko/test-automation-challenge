/*global require, console, __dirname*/
var express = require('express'),
	session = require('express-session'),
	handlebars = require('express-handlebars'),
	setUpAccountAdmin = require('./set-up-account-admin'),
	setUpItemPages = require('./set-up-item-pages'),
	setUpAccountLocals = require('./set-up-account-locals'),
	setUpUserPages = require('./set-up-user-pages'),
	setUpAuthorizationPages = require('./set-up-authorization-pages'),
	setUpShoppingCart = require('./set-up-shopping-cart'),
	PaymentProcessor = require('../payment/processor'),
	cartRepository = function (req) {
		'use strict';
		return (req.session.cart = req.session.cart || []);
	},
	accountRepository = function (req) {
		'use strict';
		return (req.session.accounts = req.session.accounts || {});
	},
	itemRepository = function (req) {
		'use strict';
		return (req.session.items = req.session.items || {});
	},
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
			paymentProcessor = new PaymentProcessor();

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

		setUpAccountAdmin(app, accountRepository);
		setUpItemPages(app, itemRepository);
		setUpAuthorizationPages(app, accountRepository, cartRepository);
		setUpShoppingCart(app, cartRepository, accountRepository, itemRepository);
		setUpUserPages(app, paymentProcessor, accountRepository);

		server = app.listen(3000, function () {
			var host = server.address().address,
					port = server.address().port;
			console.log('Example app listening at http://%s:%s', host, port);
		});
	};

initializeServer();
