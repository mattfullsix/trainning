/* jshint browser:true */
/* global Backbone, _, $, Lawnchair */

var CheckInsCollection = require('models/collection');
var cnxSvc = require('lib/connectivity');

var collection = new CheckInsCollection();
var localStore = new Lawnchair({ name: 'checkins' }, $.noop);

function addCheckIn (checkIn) {
	checkIn.set('key', Date.now());
	if (collection.findWhere(_.pick(checkIn, 'key', 'userName')))
		return;

	collection['id' in checkIn ? 'add' : 'create'](checkIn);
}

function getCheckIns() {
	return collection.toJSON();
}

function initialLoad() {
	localStore.all(function(checkIns){
		collection.reset(checkIns);
	});
}

function syncPending() {
	if (!cnxSvc.isOnline())
		return;

	var pendings = collection.filter(function(model) { return model.isNew(); });
	if (pendings.length) {
		collection.on('sync', accountForSync);
		_.invoke(pendings, 'save');
	} else {
		collection.fetch({ reset: true });
	}

	function accountForSync(model) {
		pendings = _.without(pendings, model);
		if (pendings.length)
			return;

		collection.off('sync', accountForSync);
		collection.fetch({ reset: true });
	}
}

initialLoad();
syncPending();
Backbone.Mediator.subscribe('connectivity:online', syncPending);

collection.on('reset', function () {
	localStore.nuke(function() {
		localStore.batch(collection.toJSON());
	});
	Backbone.Mediator.publish('checkins:reset');
});

collection.on('add', function (model) {
	localStore.save(model.toJSON());
	Backbone.Mediator.publish('checkins:new', model.toJSON());
});

collection.on('sync', function(model) {
	if (model instanceof collection.model)
		localStore.save(model.toJSON());
});

exports.addCheckIn = addCheckIn;
exports.getCheckIns = getCheckIns;
