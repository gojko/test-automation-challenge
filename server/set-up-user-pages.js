/*global module */
module.exports = function setUpUserPages(app, paymentProcessor, accountRepository) {
	'use strict';
	var MAX_ACCOUNT_LIMIT = 10000,
		TX_LIMIT = 5000;
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
		} else if (accountRepository(req)[name] + amount > MAX_ACCOUNT_LIMIT) {
			error = 'Account limit exceeded';
		} else if (amount > TX_LIMIT) {
			error = 'Transaction limit exceeded';
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
};
