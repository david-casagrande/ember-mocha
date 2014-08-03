import Application from 'quad/app';
import Router from 'quad/router';
import imageLoadedHelper from './image_loaded'; 
import waitFor from './wait_for'; 
import Resolver from 'ember/resolver';
import injectStoreIntoComponents from 'quad/initializers/inject_store_into_components';

export default function appLite(opts) {
  opts = opts || {};
  var App;
  
  Ember.LOG_VERSION = false;

  Ember.Test.registerAsyncHelper('imageLoaded', imageLoadedHelper);
  Ember.Test.registerAsyncHelper('waitFor', waitFor);

  var attributes = Ember.merge({
    rootElement: '#ember-testing'
  }, {});

  Application = Ember.Application.extend(attributes);

  var ApplicationView = Ember.View.extend({
    template: Ember.Handlebars.compile(opts.template)
  });

  var ApplicationController = Ember.ObjectController.extend(opts.setupData);

  Application.initializer({
    name: '__appLiteInitializer',
    after: ['store'],

    initialize: function(container, application) {
      application.register('view:application', ApplicationView);
      application.register('controller:application', ApplicationController);

      var resolver = Resolver['default'].create();

      resolver.namespace = {
        modulePrefix: 'quad'
      };

      for (var i = opts.deps.length; i > 0; i--) {
        var fullName = opts.deps[i - 1];
        application.register(fullName, resolver.resolve(fullName));

        /* automatically register component template if one exists */
        if(fullName.match(/component:/)) {
          var componentTemplate = 'template:components/' + fullName.split(':')[1];
          if(resolver.resolve(componentTemplate)) {
            application.register(componentTemplate, resolver.resolve(componentTemplate));
            application.inject(fullName, 'layout', componentTemplate);
          }
        }

      }
    }
  });

  Application.initializer(injectStoreIntoComponents);

  Ember.run.join(function(){   
    App = Application.create(attributes);
    App.setupForTesting();
    App.injectTestHelpers();
  });

  Router.reopen({
    location: 'none'
  });

  return App;
}
