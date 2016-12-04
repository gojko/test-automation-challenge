/*global module, require */
var uuid = require('uuid');
module.exports = function setUpItemPages(app, itemRepository) {
	'use strict';
	app.post('/util/item', function (req, res) {
		var name = req.body.name,
				price = req.body.price,
				description = req.body.description,
				items = itemRepository(req),
				itemId = uuid.v4();
		if (!price || isNaN(price)) {
			res.render('item-setup', {error: 'Price must be numeric'});
		} else if (!name) {
			res.render('item-setup', {error: 'Item name is mandatory'});
		} else {
			items[itemId] = {name: name, description: description, price: price, id: itemId};
			res.render('item', items[itemId]);
		}
	});
	app.get('/util/item', function (req, res) {
		res.render('item-setup');
	});
	app.get('/item/:id', function (req, res) {
		var id = req.params.id;
		res.render('item', itemRepository(req)[id]);
	});
};
