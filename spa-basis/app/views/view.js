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
