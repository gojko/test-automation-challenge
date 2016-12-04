/*global module */
module.exports = function setUpAccountAdmin(app, accountRepository) {
	'use strict';
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
};
