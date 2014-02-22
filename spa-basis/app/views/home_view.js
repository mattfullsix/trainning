/* global moment */
var View = require('./view');
var userName = require('lib/notifications').userName;
var CheckInView = require('./check_in_view');
var HistoryView = require('./history_view');
var cnxSvc = require('lib/connectivity');

module.exports = View.extend({
	subscriptions: {
		'connectivity:online': 'syncMarker',
		'connectivity:offline': 'syncMarker',
	},

	template: require('./templates/home'),

	afterRender: function afterHomeRender() {
		this.syncMarker();
		this.startClock();
		new CheckInView({ el: this.$('#checkInUI') }).render();
		new HistoryView({ el: this.$('#historyUI') }).render();
	},

	getRenderData: function getHomeRenderData() {
		return {
			now : moment().format('dddd D MMMM YYYY HH:mm:ss'),
			userName: userName
		};
	},

	startClock: function startClock() {
		this.clock = this.clock || this.$('#ticker');
		var that = this;
		setInterval(function() {
			that.clock.text(that.getRenderData().now);
		}, 1000);
	},

	syncMarker: function syncMarker() {
		this.marker = this.marker || this.$('#onlineMarker').tooltip({ placement: 'bottom' });
		this.marker[cnxSvc.isOnline() ? 'show' : 'hide']('fast');
	}
});
