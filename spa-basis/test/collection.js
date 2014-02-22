var assert = require('assert');
Backbone = require('backbone');
global.navigator = {};

/* global describe, it, beforeEach */

describe('la collection', function() {
	var coll;

	beforeEach(function setupCollection() {
		var CheckInsCollection = require('models/collection');
		coll = new CheckInsCollection();
	});

	// test
	it('maintiens un ordre naturel', function () {
		var oldCheckIn= { key: Date.now() - 1000000 };
		var recentCheckIn = { key: Date.now() - 1000 };

		coll.add(oldCheckIn);
		coll.add(recentCheckIn);

		assert.deepEqual(coll.at(0).toJSON(), recentCheckIn, 'le récent devrait être en premier');
		assert.deepEqual(coll.at(1).toJSON(), oldCheckIn, 'le plus ancien devrait être en dernier');
	});

	// pending
	it('is pending');

	// asynchrone
	it('va vite', function (done){
		setTimeout(done, 10);
	});
});
