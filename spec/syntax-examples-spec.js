/*global describe, expect, it*/
describe('Examples of test syntax', function () {
	'use strict';
	describe('synchronous tests do not have arguments in the "it" function, and just directly assert on expectations', function () {
		it('should pass simple validations', function () {
			expect(true).toBeTruthy();
			expect(false).toBeFalsy();

			expect(100).toEqual(100);
			expect(100).not.toEqual(200);

			expect("hello there").toEqual("hello there");
			expect("hello there").not.toEqual("hello there 2");

			expect("hello there").toMatch(/hell.*/);
		});
	});
	describe('test suites have several "it" functions', function () {
		it('passes the first test', function () {
			expect(true).toBeTruthy();
		});
		it('passes the second test', function () {
			expect(true).toBeTruthy();
		});
	});
	describe('test suites can prepare and clean up using beforeEach and afterEach', function () {
		var someVal;
		beforeEach(function () {
			someVal = 200;
		});
		afterEach(function () {
			someVal = 0;
		});
		it('passes the first test', function () {
			expect(someVal).toEqual(200);
		});
	});
	describe('asynchronous tests should use an argument for "it"/"beforeEach"/"afterEach" functions, and call the argument function at the end', function () {
		var asyncDelay = function (timeout) {
			return new Promise(function (resolve) {
				setTimeout(resolve, timeout);
			});
		};
		beforeEach(function (done) { // note "done"
			console.log('waiting to set up');
			asyncDelay(500).then(function () {
				console.log('done setting up');
			}).then(done, done.fail); // note the last step in the 'then' chain
		});
		it('should wait a bit', function (done) { // note "done"
			console.log('running an async test');
			asyncDelay(200).then(function () {
				console.log('waiting a bit more');
				return asyncDelay(100); // note the "return" for another async function
			}).then(function () {
				expect(100).toEqual(100);
			}).then(done, done.fail); // note the last step in the 'then' chain
		});
	});
});
