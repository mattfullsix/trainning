/* global _ */

var View = require('./view');
var store = require('lib/persistence');

module.exports = View.extend({
	listTemplate : require('./templates/check_ins'),
	subscriptions: {
		'checkins:new': 'insertCheckIn',
		'checkins:reset': 'render'
	},
	template: require('./templates/history'),

	getRenderData: function getHistoryRenderData() {
		return { checkIns: this.listTemplate(store.getCheckIns()) };
	},

	insertCheckIn: function insertCheckIn(checkIn) {
		checkIn.extraClass = 'new';
		var html = this.listTemplate([checkIn]);
		this.$('#history').prepend(html);
		var that = this;
		_.defer(function() {
			that.$('#history li.new').removeClass('new');
		});
	}
});
