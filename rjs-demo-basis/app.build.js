// Toutes les options sont détaillées ici :
// https://github.com/jrburke/r.js/blob/master/build/example.build.js
({
	appDir: "./",
  baseUrl: "scripts",
  dir: "../rjs-demo-optimized3",
  include:['almond'],
  name: "main",
  optimize: 'uglify2', // or 'uglify2'
  optimizeCss: 'none', // or 'standard'
  fileExclusionRegExp: /^(?:\.|app\.build\.js|require\.js|node_modules)/, // or /^(?:\.|app\.build\.js|require\.js|node_modules)/
  removeCombined: true,
  wrap: true,

  generateSourceMaps: true,
  preserveLicenseComments: false,

  onModuleBundleComplete: function() {
    var fs = require.nodeRequire('fs');
    var path = '../rjs-demo-optimized3/index.html';
    var src = fs.readFileSync(path, { encoding: 'utf-8'});
    src = src.replace('data-main="scripts/main" src="scripts/require.js"', 'src="scripts/main.js"');
    fs.writeFileSync(path, src);
  }
})
