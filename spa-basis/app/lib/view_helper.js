// Ce module est un emplacement dédié pour tous nos helpers Handlebars.

// Petit helper formattant un nombre de secondes avec un niveau
// d'arrondi plus parlant (tel quel sous la minute, en minutes sinon).
Handlebars.registerHelper('seconds_to_minutes', function(secs) {
  return secs < 50 ? secs + 's' : Math.round(secs / 60) + 'mn';
});