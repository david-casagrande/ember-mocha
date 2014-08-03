import Application from 'quad/app';
import Router from 'quad/router';
import imageLoadedHelper from './image_loaded'; 
import waitFor from './wait_for'; 

function startApp(attrs, template) {
  var App;
  
  Ember.LOG_VERSION = false;

  Ember.Test.registerAsyncHelper('imageLoaded', imageLoadedHelper);
  Ember.Test.registerAsyncHelper('waitFor', waitFor);

  if(template) {
    var AppView = Ember.View.extend({
      template: Ember.Handlebars.compile(template)
    });
  
    Application.initializer({
      name: 'tempAppView',
      initialize: function(container, application) {
        container.register('view:index', AppView);
      }
    });

    Application.reopen({
      destroy: function() {
        delete Application.initializers['tempAppView'];
        this._super();
      }
    });
  }

  var attributes = Ember.merge({
    rootElement: '#ember-testing'
  }, attrs);

  Application = Application.extend(attributes)

  Ember.run.join(function(){   
    App = Application.create();
    App.setupForTesting();
    App.injectTestHelpers();
  });

  Router.reopen({
    location: 'none'
  });

  return App;
}

export default startApp;
