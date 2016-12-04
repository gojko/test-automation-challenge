/*global module */
module.exports = function setUpAccountLocals(req, res) {
	'use strict';
	if (req.session.admin) {
		res.locals.currentAccount = 'admin';
	} else {
		res.locals.currentAccount = req.session && req.session.loggedInAccount;
	}
	res.locals.isAdmin = req.session.admin;
};
