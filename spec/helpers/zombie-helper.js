/*global beforeAll, require, expect */
beforeAll(function () {
	'use strict';
	var Browser = require('zombie'),
			asyncFail = function (error) {
				expect(error.stack).toBeFalsy();
			};
	Browser.localhost('example.com', 3000);
	this.Browser = Browser;
	this.asyncFail = asyncFail;
});
