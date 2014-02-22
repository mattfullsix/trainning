(function(/*! Brunch !*/) {
  'use strict';

  var globals = typeof window !== 'undefined' ? window : global;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};

  var has = function(object, name) {
    return ({}).hasOwnProperty.call(object, name);
  };

  var expand = function(root, name) {
    var results = [], parts, part;
    if (/^\.\.?(\/|$)/.test(name)) {
      parts = [root, name].join('/').split('/');
    } else {
      parts = name.split('/');
    }
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function(name) {
      var dir = dirname(path);
      var absolute = expand(dir, name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var module = {id: name, exports: {}};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var require = function(name, loaderPath) {
    var path = expand(name, '.');
    if (loaderPath == null) loaderPath = '/';

    if (has(cache, path)) return cache[path].exports;
    if (has(modules, path)) return initModule(path, modules[path]);

    var dirIndex = expand(path, './index');
    if (has(cache, dirIndex)) return cache[dirIndex].exports;
    if (has(modules, dirIndex)) return initModule(dirIndex, modules[dirIndex]);

    throw new Error('Cannot find module "' + name + '" from '+ '"' + loaderPath + '"');
  };

  var define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has(bundle, key)) {
          modules[key] = bundle[key];
        }
      }
    } else {
      modules[bundle] = fn;
    }
  };

  var list = function() {
    var result = [];
    for (var item in modules) {
      if (has(modules, item)) {
        result.push(item);
      }
    }
    return result;
  };

  globals.require = require;
  globals.require.define = define;
  globals.require.register = define;
  globals.require.list = list;
  globals.require.brunch = true;
})();
require.register("application", function(exports, require, module) {
require('lib/appcache');

// L'appli principale.  Reste super basique à ce stade : on a un seul
// écran donc pas de routes spéciales pour plein de trucs, et on
// connecte juste la racine à la Home View.
var Application = {
  initialize: function() {
    var HomeView = require('views/home_view');
    var Router = require('lib/router');
    
    this.homeView = new HomeView();
    this.router = new Router();
    if ('function' === typeof Object.freeze)
      Object.freeze(this);
  }
};

module.exports = Application;

});

;require.register("initialize", function(exports, require, module) {
// L'initialiseur applicatif.  Se contente de faire deux choses :
//
// 1. Instancier l'application JS et l'initialiser
// 2. Activer la gestion des routes Backbone (même si on ne s'en
//    sert pas particulièrement ici)

var application = require('application');

$(function() {
  moment.lang('fr');
  application.initialize();
  Backbone.history.start();
});

});

;require.register("lib/appcache", function(exports, require, module) {
if (!window.applicationCache)
	return;

window.applicationCache.addEventListener('updateready', function (){
	$('#reloadPrompt').modal({ show: true });
});

});

;require.register("lib/connectivity", function(exports, require, module) {
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

});

;require.register("lib/location", function(exports, require, module) {
// Encapsulation du service de géolocalisation.  Va envoyer
// un message si le client ne prend pas en charge l'API de
// géolocalisation W3C.

// Si cette API n'est pas exploitable pour une raison quelconque
// (ex. connexion à un DSLAM mal équipé/configuré, genre au fin
// fond de la Creuse…), on peut travailler avec cette appli en
// plaçant cette variable `$FAKE` à `true`, ce qui renverra
// "en dur" les coordonnées du siège de Delicious Insights ;-)
var $FAKE = false;

// Voici la méthode-clé de vérification de la géolocalisation.
// C'est la seule méthode exposée par le module.  L'API W3C tente
// en général d'exploiter une précision maximale (par exemple en
// interpolant les données issues de points d'accès Wi-Fi proches).
// Le callback est appelé soit avec une latitude et une longitude
// (en cas de succès) soit avec un message d'erreur.
//
// Performance : la géoloc navigateur par des moyens non-GPS
// (ex. interpolation Wi-Fi, requêtage DSLAM…) peut prendre pas
// mal de temps (4-6s pendant mes tests).
function getCurrentLocation(callback) {
  if (!_.isFunction(callback))
    throw 'Missing or invalid callback';
  if ($FAKE) {
    callback(48.88268482, 2.32229512);
  } else {
    navigator.geolocation.getCurrentPosition(function(position) {
      callback(position.coords.latitude, position.coords.longitude);
    }, function(msg) {
      if (!_.isString(msg)) msg = 'Geolocation failure';
      callback(msg);
    });
  }
}

if (navigator.geolocation) {
  module.exports = { getCurrentLocation: getCurrentLocation };
} else {
  alert("Ah flute, pas de geoloc dans le navigateur, snif…");
}

});

;require.register("lib/notifications", function(exports, require, module) {
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

});

;require.register("lib/persistence", function(exports, require, module) {
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

});

;require.register("lib/places", function(exports, require, module) {
/* jshint browser:true */
/* global _, document, google, $ */

// Encapsulation de la bibliothèque Places au sein de la Google Maps v3 JS API.
// La formation ne s'occupe pas des détails de ce module, qui est annexe au
// sujet.

// Clé API dédiée à l'atelier.  Permet 1K req/jour, pensez à enregistrer
// votre propre appli et clé sur http://code.google.com/apis/console
var JSGURUV3_API_KEY = 'AIzaSyCoiEjsdXfD5roowpX5jN3cwImV1TgGzIs';

// On s'intéresse uniquement à certains types de POI.
var POI_TYPES = ['bakery', 'bar', 'cafe', 'food', 'meal_takeaway', 'restaurant'];

// On filtre les résultats sur un certain rayon (en mètres) autour des géocoords
// initiales.
var RADIUS = 500;

// On limite aussi le resultset à un certain nombre de POI, sinon ça devient
// vite le souk à scanner.
var MAX_PLACES = 12;

// On fait attention à la connectivité pour éviter les appels en offline
// et rafraîchir automatiquement en cas d'online à nouveau.
var placesService, distanceService, cnxSvc = require('lib/connectivity');

// Si cette API n'est pas exploitable pour une raison quelconque
// (ex. on est offline), on peut travailler avec cette appli en
// plaçant cette variable `$FAKE` à `true`, ce qui renverra
// "en dur" des POI autour du siège de Delicious Insights ;-)
var $FAKE = false;

// Fonction interne d'initialisation de l'API par chargement
// asynchrone de la lib depuis chez Google et exploitation d'un
// callback.
function initializePlacesAPI() {
  if (placesService || !cnxSvc.isOnline()) return;
  var script = document.createElement('script');
  script.src = 'http://maps.googleapis.com/maps/api/js?key=' + JSGURUV3_API_KEY +
    '&libraries=places&sensor=true&callback=makePlacesReady';

  window.makePlacesReady = function() {
    delete window.makePlacesReady;
    var div = document.createElement('div');
    placesService = new google.maps.places.PlacesService(div);
    distanceService = new google.maps.DistanceMatrixService();
  };

  $('script:first').after(script);
}

// Recherche des POI pertinents près d'une position donnée.  La position peut
// $etre donnée soit en deux arguments (latitude et longitue) soit en tant que
// `google.maps.LatLng`, donc un seul argument.  Dans les deux cas, l'argument
// final *doit* être une fonction de rappel, qui sera appelée avec un tableau de
// hashes représentant les POI.
//
// Performance : durant les tests, c'est assez rapide--pas plus d’1s.
function lookupPlaces(lat, lng, callback) {
  if (!placesService && !$FAKE) {
    console.log('Place search service isn’t ready yet! Deferring 1s…');
    _.delay(lookupPlaces, 1000, lat, lng, callback);
    return;
  }

  // On joue offline ? Pas grave, on renvoie des trucs de test histoire de…
  if ($FAKE) {
    callback([
      { name: 'Le Mont Liban', vicinity: '42 Boulevard Batignolles', distance: 65, duration: 49 },
      { name: 'La Raymondine', vicinity: '42 Boulevard Batignolles', distance: 65, duration: 49 },
      { name: 'Batignolles Express', vicinity: '32 Rue Batignolles', distance: 80, duration: 60 },
      { name: 'Les Batignolles', vicinity: '31 Boulevard Batignolles', distance: 99, duration: 68 },
      { name: 'AGD', vicinity: '36 Boulevard Batignolles', distance: 99, duration: 68 },
      { name: 'Le Paris Rome', vicinity: '60 Boulevard Batignolles', distance: 103, duration: 88 },
      { name: 'Picard Surgelés', vicinity: '37 Avenue Clichy', distance: 108, duration: 92 },
      { name: 'La Boutique de Camille', vicinity: '33 Boulevard Batignolles', distance: 126, duration: 115 },
      { name: 'Fédération de la Boucherie', vicinity: '23 Rue Clapeyron', distance: 127, duration: 116 }
    ]);
    return;
  }

  if (!cnxSvc.isOnline()) {
    callback([]);
    return;
  }

  // Traitements de la signature variable pour l'appel à cette fonction.
  callback = arguments[arguments.length - 1];
  if (!_.isFunction(callback))
    throw 'Missing or invalid callback';
  var latLng;
  if (lat instanceof google.maps.LatLng)
    latLng = lat;
  else if (_.isUndefined(lng))
    throw 'Invalid call: requires either a LatLng or a latitude plus a longitude';
  else
    latLng = new google.maps.LatLng(lat, lng);

  // Lancement de la recherche
  placesService.search({
    location: latLng,
    rankBy:   google.maps.places.RankBy.DISTANCE,
    types:    POI_TYPES
  }, function(result, status) {
    if (google.maps.places.PlacesServiceStatus.OK !== status) {
      callback([]);
      return;
    }

    // Bon, maintenant on chope la distance pour chaque point (car Google Places
    // n'a pas eu la bonne idée de le filer, tsk tsk).  Heureusement, l'API concernée
    // est super rapide (sans doute vu qu'elle n'a aucune I/O à faire côté Google).
    var dests = $.map(result, function(p) { return p.geometry.location; });
    distanceService.getDistanceMatrix({
      origins: [latLng],
      destinations: dests,
      travelMode: google.maps.TravelMode.WALKING
    }, function(distances) {
      for (var index = 0, l = result.length; index < l; ++index) {
        var item = result[index], dist = distances.rows[0].elements[index];
        result[index] = {
          id:       item.id,
          icon:     item.icon,
          name:     item.name,
          vicinity: item.vicinity,
          distance: dist.distance.value,
          duration: dist.duration.value
        };
      }
      result = _.filter(result, function(r) { return r.distance <= RADIUS; });
      result = _.sortBy(result, function(r) { return r.distance; });
      callback(result.slice(0, MAX_PLACES));
    });
  });
}

initializePlacesAPI();
Backbone.Mediator.subscribe('connectivity:online', initializePlacesAPI);

module.exports = {
  lookupPlaces: lookupPlaces,
  poiTypes: POI_TYPES
};

});

;require.register("lib/router", function(exports, require, module) {
// Le routeur le plus basique du monde…

var application = require('application');

module.exports = Backbone.Router.extend({
  routes: {
    '': 'home'
  },

  home: function() {
    $('body').html(application.homeView.render().el);
  }
});

});

;require.register("lib/view_helper", function(exports, require, module) {
// Ce module est un emplacement dédié pour tous nos helpers Handlebars.

// Petit helper formattant un nombre de secondes avec un niveau
// d'arrondi plus parlant (tel quel sous la minute, en minutes sinon).
Handlebars.registerHelper('seconds_to_minutes', function(secs) {
  return secs < 50 ? secs + 's' : Math.round(secs / 60) + 'mn';
});
});

;require.register("models/check_in", function(exports, require, module) {
/* global Backbone */
var cnxSync = require('lib/connectivity');

module.exports = Backbone.Model.extend({
	sync: function sync(method, model, options) {
		if (!cnxSync.isOnline())
			return;
		
		return Backbone.sync(method, model, options);
	}
});

});

;require.register("models/collection", function(exports, require, module) {
/* global Backbone */

module.exports = Backbone.Collection.extend({
	comparator: function compareCheckIns (c1, c2) {
		return +c2.get('key') - +c1.get('key');
	},

	model: require('models/check_in'),

	url: '/checkins'
});

});

;require.register("views/check_in_view", function(exports, require, module) {
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

});

;require.register("views/history_view", function(exports, require, module) {
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

});

;require.register("views/home_view", function(exports, require, module) {
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

});

;require.register("views/templates/check_in", function(exports, require, module) {
module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function";


  buffer += "<header class=\"row\">\r\n  <p id=\"geoloc\" class=\"lead pull-left\">Je suis…</p>\r\n  <button type=\"button\" class=\"btn btn-info pull-right\">Chercher des endroits à proximité</button>\r\n</header>\r\n \r\n<ul id=\"places\" class=\"row list-unstyled\">";
  if (stack1 = helpers.placeList) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.placeList; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</ul>\r\n \r\n<form id=\"submission\" class=\"row form-inline\" role=\"form\">\r\n  <div class=\"col-sm-9 col-xs-12\">\r\n    <input type=\"text\" placeholder=\"Votre commentaire ici…\" id=\"comment\" class=\"form-control\">\r\n  </div>\r\n  <div class=\"col-sm-3 col-xs-12\">\r\n    <button type=\"submit\" class=\"btn btn-primary\">Check-In&nbsp;!</button>\r\n  </div>\r\n</form>";
  return buffer;
  });
});

;require.register("views/templates/check_ins", function(exports, require, module) {
module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\r\n	<li class=\"";
  if (stack1 = helpers.extraClass) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.extraClass; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">\r\n		<div class=\"icon\">\r\n			<img src=\"";
  if (stack1 = helpers.icon) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.icon; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" alt=\"\" class=\"img-responsive\">\r\n		</div>\r\n		<div class=\"details\">\r\n			<strong title=\"";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</strong>\r\n			<time>";
  if (stack1 = helpers.stamp) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.stamp; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</time>\r\n			<address>";
  if (stack1 = helpers.vicinity) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.vicinity; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</address>\r\n			<cite>";
  if (stack1 = helpers.userName) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.userName; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</cite>\r\n			";
  stack1 = helpers['if'].call(depth0, depth0.comment, {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\r\n		</div>\r\n	</li>\r\n";
  return buffer;
  }
function program2(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\r\n				<q>";
  if (stack1 = helpers.comment) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.comment; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</q>\r\n			";
  return buffer;
  }

  stack1 = helpers.each.call(depth0, depth0, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { return stack1; }
  else { return ''; }
  });
});

;require.register("views/templates/history", function(exports, require, module) {
module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function";


  buffer += "<ul id=\"history\" class=\"list-unstyled\">";
  if (stack1 = helpers.checkIns) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.checkIns; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</ul>";
  return buffer;
  });
});

;require.register("views/templates/home", function(exports, require, module) {
module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div class=\"container\">\n  <div class=\"navbar navbar-default navbar-fixed-top\" role=\"navigation\">\n    <div class=\"navbar-header\">\n      <button type=\"button\" class=\"navbar-toggle\" data-toggle=\"collapse\" data-target=\".navbar-ex1-collapse\">\n        <span class=\"sr-only\">Basculer nav.</span>\n        <span class=\"icon-bar\"></span>\n        <span class=\"icon-bar\"></span>\n        <span class=\"icon-bar\"></span>\n      </button>\n      <a class=\"navbar-brand\" href=\"#\">JS Total 21 février 2014</a>\n    </div>\n\n    <div class=\"collapse navbar-collapse navbar-ex1-collapse\">\n      <ul class=\"nav navbar-nav\">\n        <li>\n          <p class=\"navbar-text\">\n            <i id=\"onlineMarker\" class=\"glyphicon glyphicon-signal\" title=\"Vous êtes connecté(e)\"></i>\n            <span>";
  if (stack1 = helpers.userName) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.userName; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</span>\n          </p>\n      </ul>\n      <ul class=\"nav navbar-nav navbar-right\">\n        <li>\n          <p class=\"navbar-text\">\n            <i class=\"glyphicon glyphicon-time\"></i>\n            <span id=\"ticker\">";
  if (stack1 = helpers.now) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.now; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</span>\n            &nbsp;\n          </p>\n        </li>\n      </ul>\n    </div>\n  </div>\n\n  <div class=\"row\">\n    <div class=\"col-md-8\"><div id=\"checkInUI\" class=\"well\"></div></div>\n    <div class=\"col-md-4\"><div id=\"historyUI\" class=\"well\"></div></div>\n  </div>\n\n  <div class=\"modal fade\" id=\"reloadPrompt\">\n    <div class=\"modal-dialog\">\n      <div class=\"modal-content\">\n        <div class=\"modal-header\">\n          <button class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">×</button>\n          <h4 class=\"modal-title\">Nouvelle version disponible !</h4>\n        </div>\n        <div class=\"modal-body\">\n          <p>Une nouvelle version de cette application est disponible.</p>\n          <p>Souhaitez-vous la charger dès maintenant ?</p>\n        </div>\n        <div class=\"modal-footer\">\n          <a href=\"\" class=\"btn btn-primary\">Mais carrément !</a>\n          <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Nan, pas la peine</button>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n";
  return buffer;
  });
});

;require.register("views/templates/places", function(exports, require, module) {
module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var stack1, functionType="function", escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1, options;
  buffer += "\r\n	<li class=\"col-md-4 col-sm-6\" data-place-id=\"";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.id; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">\r\n		<div class=\"icon\">\r\n			<img src=\"";
  if (stack1 = helpers.icon) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.icon; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" alt=\"\" class=\"img-responsive\">\r\n		</div>\r\n		<div class=\"details\">\r\n			<strong title=\"";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">";
  if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.name; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</strong>\r\n			<address>";
  if (stack1 = helpers.vicinity) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.vicinity; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</address>\r\n			<small>(à ";
  if (stack1 = helpers.distance) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.distance; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "m, soit ";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.seconds_to_minutes || depth0.seconds_to_minutes),stack1 ? stack1.call(depth0, depth0.duration, options) : helperMissing.call(depth0, "seconds_to_minutes", depth0.duration, options)))
    + " à pied)</small>\r\n		</div>\r\n	</li>\r\n";
  return buffer;
  }

function program3(depth0,data) {
  
  
  return "\r\n	<li class=\"searching\">\r\n		<img src=\"/images/spinner.gif\" alt=\"\" class=\"spinner\">\r\n		Recherche en cours...\r\n	</li>\r\n";
  }

  stack1 = helpers.each.call(depth0, depth0.places, {hash:{},inverse:self.program(3, program3, data),fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { return stack1; }
  else { return ''; }
  });
});

;require.register("views/view", function(exports, require, module) {
require('lib/view_helper');

// Classe de base pour toutes les vues.  Presque pile
// celle de brunch.io (on a juste ajouté le _.defer pour
// régler automatiquement toute une catégorie de bugs,
// et initialisé la langue de Moment.js).
module.exports = Backbone.View.extend({
  initialize: function() {
    _.bindAll(this, 'template', 'getRenderData', 'render', 'afterRender');
  },

  template: function() {},
  getRenderData: function() {},

  render: function() {
    this.$el.html(this.template(this.getRenderData()));
    _.defer(this.afterRender);
    return this;
  },

  afterRender: function() {}
});

});

;
//# sourceMappingURL=app.js.map