var compileES6 = require('broccoli-es6-concatenator')
var pickFiles = require('broccoli-static-compiler')
var mergeTrees = require('broccoli-merge-trees')

var app = pickFiles('lib', {
  files: ['**/*.js'],
  srcDir: '/',
  destDir: '/ember-mocha'
})

var compiledApp = compileES6(app, {
  //loaderFile: 'quad/loader.js',
  ignoredModules: ['quad/app', 'quad/router', 'ember', 'ember/resolver', 'quad/initializers/inject_store_into_components'],
  inputFiles: ['**/*.js'],
  legacyFilesToAppend: [],
  wrapInEval: false,
  outputFile: '/ember-mocha.js'
})

module.exports = compiledApp;
