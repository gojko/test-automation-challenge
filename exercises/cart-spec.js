/*global describe, beforeEach, afterEach, it, expect, require */
var Browser = require('zombie'),
	AccountSetupForm = function (browser) {
		'use strict';
		var self = this;
		self.submit = function (name, balance) {
			return browser.visit('/util/account').then(function () {
				return browser.fill('name', name)
					.fill('amount', balance)
					.pressButton('#set-up-account');
			});
		};
	},
	LoginForm = function (browser) {
		'use strict';
		var self = this;
		self.submit = function (username, password) {
			return browser.visit('/log-in').then(function () {
				return browser.fill('name', username)
					.fill('password', password)
					.pressButton('#log-in');
			});
		};
	},
	ItemSetupForm = function (browser) {
		'use strict';
		var self = this;
		self.submit = function (name, price, description) {
			return browser.visit('/util/item').then(function () {
				return browser.fill('name', name)
					.fill('price', price)
					.fill('description', description)
					.pressButton('#set-up-item');
			}).then(function () {
				return browser.text('#item-id');
			});
		};
	},
	ShoppingCartWorkflow = function (browser) {
		'use strict';
		var self = this,
			loginForm = new LoginForm(browser);
		self.signIn = function (username, password) {
			return loginForm.submit(username, password);
		};
		self.signOut = function () {
			if (browser.querySelector('#log-out')) {
				return browser.pressButton('#log-out');
			}
		};
		self.add = function (itemId) {
			return browser.visit('/item/' + itemId).then(function () {
				return browser.pressButton('#add-to-cart');
			}).then(function () {
				var error = browser.text('#error');
				if (error) {
					return { error: error, numItems: 0, totalPrice: 0 };
				} else {
					return { numItems: parseInt(browser.text('#numItems')), totalPrice: parseFloat(browser.text('#totalPrice'))};
				}
			});
		};
	},
	AdminWorkflow = function (browser) {
		'use strict';
		var self = this,
				loginForm = new LoginForm(browser),
				itemSetupForm = new ItemSetupForm(browser),
				accountSetupForm = new AccountSetupForm(browser),
				ensureAdminLoggedIn = function () {
					return loginForm.submit('admin', 'admin');
				},
				itemIds = {};
		self.getItemId = function (itemName) {
			return itemIds[itemName];
		};
		self.addUserAccount = function (username, balance) {
			return ensureAdminLoggedIn().then(function () {
				return accountSetupForm.submit(username, balance);
			});
		};
		self.addItem = function (name, price, description) {
			return ensureAdminLoggedIn().then(function () {
				return itemSetupForm.submit(name, price, description);
			}).then(function (id) {
				itemIds[name] = id;
				return id;
			});
		};
	};
describe('Purchasing', function () {
	'use strict';
	var browser,
		shoppingCartWorkflow,
		adminWorkflow;
	beforeEach(function (done) {
		Browser.localhost('example.com', 3000);
		browser = new Browser();
		shoppingCartWorkflow = new ShoppingCartWorkflow(browser);
		adminWorkflow = new AdminWorkflow(browser);

		adminWorkflow.addUserAccount('test-user', 1000).then(function () {
			return adminWorkflow.addItem('blue book', 505, 'some desc');
		}).then(done, done.fail);
	});
	afterEach(function () {
		browser.destroy();
	});


	/** better, but still a bit too much on how to execute, not enough on why */
	describe('adding to cart', function () {
		it('cannot add items when signed in as admin', function (done) {
			shoppingCartWorkflow.signIn('admin', 'admin').then(function () {
				return shoppingCartWorkflow.add(adminWorkflow.getItemId('blue book'));
			}).then(function (result) {
				expect(result.error).toEqual('Cannot use admin account for this action - log in as a normal user.');
				expect(result.totalPrice).toEqual(0);
				expect(result.numItems).toEqual(0);
			}).then(done, done.fail);
		});
		describe('when signed in as an user', function () {
			beforeEach(function (done) {
				shoppingCartWorkflow.signIn('test-user', 'test-user')
					.then(done, done.fail);
			});
			it('can add one item to cart when signed in as an user', function (done) {
				shoppingCartWorkflow.add(adminWorkflow.getItemId('blue book'))
				.then(function (result) {
					expect(result.error).toBeFalsy();
					expect(result.totalPrice).toEqual(505);
					expect(result.numItems).toEqual(1);
				}).then(done, done.fail);
			});
			it('can add two items to cart when signed in as an user', function (done) {
				shoppingCartWorkflow.add(adminWorkflow.getItemId('blue book'))
				.then(function () {
					return shoppingCartWorkflow.add(adminWorkflow.getItemId('blue book'));
				}).then(function (result) {
					expect(result.error).toBeFalsy();
					expect(result.totalPrice).toEqual(1010);
					expect(result.numItems).toEqual(2);
				}).then(done, done.fail);
			});
		});
	});

	/////////////////////////////////////////////

	/* describe why */
	describe('allow only regular users to add items, to prevent fraud and ensure we can deliver orders', function () {
		/* automate how */
		var whenUserAddsToCard = function (username) {
				return shoppingCartWorkflow.signOut().then(function () {
					if (username) {
						return shoppingCartWorkflow.signIn(username, username);
					}
				}).then(function () {
					return shoppingCartWorkflow.add(adminWorkflow.getItemId('blue book'));
				});
			};
		/* specify what */
		it('prevents administrators from adding items', function (done) {
			whenUserAddsToCard('admin').then(function (result) {
				expect(result.error).toEqual('Cannot use admin account for this action - log in as a normal user.');
				expect(result.numItems).toEqual(0);
			}).then(done, done.fail);
		});
		it('allows users to add items before logging in', function (done) {
			whenUserAddsToCard(undefined).then(function (result) {
				expect(result.error).toBeUndefined();
				expect(result.numItems).toEqual(1);
			}).then(done, done.fail);
		});
		it('allows regular users to add items', function (done) {
			whenUserAddsToCard('test-user').then(function (result) {
				expect(result.error).toBeUndefined();
				expect(result.numItems).toEqual(1);
			}).then(done, done.fail);
		});
	});

	//////////////////////////////////////////////////
	// perhaps a bit too far for this tool

	describe('allow only regular users to add items, to prevent fraud and ensure we can deliver orders', function () {
		/* automate how */
		var whenUserAddsToCard = function (username) {
				return shoppingCartWorkflow.signOut().then(function () {
					if (username) {
						return shoppingCartWorkflow.signIn(username, username);
					}
				}).then(function () {
					return shoppingCartWorkflow.add(adminWorkflow.getItemId('blue book'));
				});
			};
		/* specify what */

		[//  test case                                       account      expected items  expected error
			['admins cannot add items',                      'admin',     0,              'Cannot use admin account for this action - log in as a normal user.'],
			['users can add items before logging in',        undefined,   1,              undefined],
			['regular users can add items after logging in', 'test-user', 1,              undefined]
		].forEach(function (testCase) {
			it(testCase[0], function (done) {
				whenUserAddsToCard(testCase[1]).then(function (result) {
					expect(result.numItems).toEqual(testCase[2]);
					expect(result.error).toEqual(testCase[3]);
				}).then(done, done.fail);
			});
		});
	});

});
