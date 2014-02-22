/* global Backbone */
var cnxSync = require('lib/connectivity');

module.exports = Backbone.Model.extend({
	sync: function sync(method, model, options) {
		if (!cnxSync.isOnline())
			return;
		
		return Backbone.sync(method, model, options);
	}
});
