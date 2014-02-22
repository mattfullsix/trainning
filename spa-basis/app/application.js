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
