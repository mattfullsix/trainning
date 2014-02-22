/* global Backbone */

module.exports = Backbone.Collection.extend({
	comparator: function compareCheckIns (c1, c2) {
		return +c2.get('key') - +c1.get('key');
	},

	model: require('models/check_in'),

	url: '/checkins'
});
