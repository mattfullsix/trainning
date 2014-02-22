/* global io */
var store = require('lib/persistence');

var userName = sessionStorage.userName || $.trim(prompt("Votre nom d'utilisateur"));

if (userName) {
	sessionStorage.userName = userName;
	/*sessionStorage.set(userName, 'userName');*/
} else {
	userName= 'Anonymous' + _.random(1, 100);
}

var socket = io.connect();
socket.on('checkin', function(checkIn) {
	store.addCheckIn(checkIn);
});

exports.userName = userName;
