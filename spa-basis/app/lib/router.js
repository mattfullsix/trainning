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
