/* global test, deepEqual, module */
module('la collection', {
	setup: function setupCollection() {
		var CheckInsCollection = require('models/collection');
		this.coll = new CheckInsCollection();
	}
});

test('maintiens un ordre naturel', function () {
	var oldCheckIn= { key: Date.now() - 1000000 };
	var recentCheckIn = { key: Date.now() - 1000 };

	this.coll.add(oldCheckIn);
	this.coll.add(recentCheckIn);

	deepEqual(this.coll.at(0).toJSON(), recentCheckIn, 'le récent devrait être en premier');
	deepEqual(this.coll.at(1).toJSON(), oldCheckIn, 'le plus ancien devrait être en dernier');
});