/*global module */
module.exports = function setUpUserPages(app, paymentProcessor, accountRepository) {
	'use strict';
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
};
