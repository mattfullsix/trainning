/* jshint browser: true */
/* global $, Backbone */

exports.isOnline = function() { return true; };

if ('onLine' in navigator) {
	exports.isOnline = function isOnline() { return navigator.onLine; };

	$(window).on('online offline', checkStatus);
	checkStatus();
}

function checkStatus() {
	Backbone.Mediator.publish(navigator.onLine ? 'connectivity:online' : 'connectivity:offline');
}
