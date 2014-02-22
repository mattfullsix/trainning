/* global $, _, moment */

var View = require('./view');
var locSvc = require('lib/location');
var poiSvc = require('lib/places');
var userName = require('lib/notifications').userName;
var store = require('lib/persistence');

module.exports = View.extend({
	currentPlace: null,

	events: {
		'click header button': 'fetchPlaces',
		'click #places li': 'selectPlace',
		'submit': 'checkIn'
	},

	listTemplate: require('./templates/places'),

	places: [],

	subscriptions: {
		'connectivity:online': 'fetchPlaces'
	},
	
	template: require('./templates/check_in'),

	afterRender: function afterCIRender() {
		this.fetchPlaces();
	},

	checkIn: function checkIn (e) {
		e.preventDefault();
		if (!this.currentPlace)
			return;

		var placeId = this.currentPlace.attr('data-place-id');
		var place = _.findWhere(this.places, { id: placeId });
		store.addCheckIn({
			placeId: place.id,
			name: place.name,
			icon: place.icon,
			vicinity: place.vicinity,
			stamp: moment().format('HH:mm'),
			userName: userName,
			comment: this.$('#comment').val()
		});
		this.updateUI(false);
	},

	fetchPlaces: function fetchPlaces () {
		var that = this;
		this.places = [];
		this.renderPlaces();
		this.updateUI(false);
		locSvc.getCurrentLocation(function (lat, lng) {
			that.$('#geoloc').text(lat.toFixed(7) + ' / ' + lng.toFixed(7));
			poiSvc.lookupPlaces(lat, lng, function (pois) {
				that.places = pois;
				that.renderPlaces();
			});
		});
	},

	getRenderData: function getCIRenderData () {
		return {
			placeList: this.listTemplate({ places: this.places })
		};
	},

	renderPlaces: function renderPlaces () {
		this.$('#places').html(this.getRenderData().placeList);
	},

	selectPlace: function selectPlace (e) {
		var active = this.$('#places li.active'), current = $(e.currentTarget);
		if (active[0] === current[0])
			return;

		active.removeClass('active');
		this.currentPlace = current.addClass('active');
		this.updateUI(true);
	},

	updateUI: function updateUI(enabled) {
		this.submitter = this.submitter || this.$('button[type="submit"]');
		if (enabled) {
			this.submitter.attr('disabled', false);
		} else {
			this.submitter.attr('disabled', true);
			if (this.currentPlace)
				this.currentPlace.removeClass('active');
			this.currentPlace = null;
			this.$('#comment').val('');
		}
	}
});
