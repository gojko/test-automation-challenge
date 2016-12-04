/*global module, require */
var setUpAccountLocals = require('./set-up-account-locals');

module.exports = function setUpAuthorizationPages(app, accountRepository, cartRepository) {
	'use strict';
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
};
