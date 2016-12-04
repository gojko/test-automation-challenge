/*global module, require */
var uuid = require('uuid');
module.exports = function PaymentProcessor() {
	'use strict';
	var self = this;
	self.process = function (request) {
		if (request.card === '4242424242424242') {
			return {
				message: 'Server is offline',
				success: false,
				id: uuid.v4()
			};
		} else if (request.card === '5555555555554444') {
			return {
				message: 'Insufficient funds',
				success: false,
				id: uuid.v4()
			};
		} else if (request.card === '4000000000000077') {
			return {
				message: 'Payment successful',
				success: true,
				id: uuid.v4()
			};
		} else {
			return {
				message: 'Payment rejected',
				success: false,
				id: uuid.v4()
			};
		}
	};
};
