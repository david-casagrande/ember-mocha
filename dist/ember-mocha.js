define("after_image_load", 
  ["exports"],
  function(__exports__) {
    "use strict";
    __exports__["default"] = function afterImageLoad(image, callback) {
      
      var imgLoaded = new Image();
      imgLoaded.onload = function() {
        return callback();
      }
      imgLoaded.src = image;
    }
  });
;define("after_run", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var asyncCount = 0;
    var callbackQueue = [];
    __exports__["default"] = function afterRun(callback) {
      return wait(callback);
    }


    function wait(value) {
      if(asyncCount === 0) { 
        Ember.run(null, value);
      }
      else {
        callbackQueue.push(value);
      }

      var waitPromise = new Ember.Test.Promise(function(resolve) {
        if(asyncCount === 0) { 
          Ember.Test.adapter.asyncStart();
        }
        asyncCount = asyncCount += 1;

        var watcher = setInterval(function() {
          if(Ember.Test.pendingAjaxRequests) { return; }
          if (Ember.run.hasScheduledTimers() || Ember.run.currentRunLoop) { return; }
          asyncCount = asyncCount -= 1;
          if(callbackQueue.length > 0) {
            //try {
              var fn = callbackQueue.shift();
              Ember.run(null, fn);
            //}
            //catch(e) {
              //console.log(e);
            //}
          }
          if(asyncCount === 0) {
            Ember.Test.adapter.asyncEnd();
          }
          clearInterval(watcher);
          Ember.run(null, resolve);
        }, 10);
      
      });
      
      return waitPromise;

    }
  });
;define("app_lite", 
  ["quad/app","quad/router","image_loaded","wait_for","ember/resolver","quad/initializers/inject_store_into_components","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __exports__) {
    "use strict";
    var Application = __dependency1__["default"];
    var Router = __dependency2__["default"];
    var imageLoadedHelper = __dependency3__["default"];

    var waitFor = __dependency4__["default"];

    var Resolver = __dependency5__["default"];
    var injectStoreIntoComponents = __dependency6__["default"];

    __exports__["default"] = function appLite(opts) {
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
  });
;define("image_loaded", 
  ["exports"],
  function(__exports__) {
    "use strict";
    function imageLoaded(app, image) {
      
      if(typeof app === 'string') {
        image = app;
      }

      var imgLoaded = false;

      var img = new Image();
      
      Ember.run(function(){
      
        img.onload = function() {
          imgLoaded = true;
        }    

      });

      img.src = image;

      return new Ember.RSVP.Promise(function(resolve) {
        Ember.Test.adapter.asyncStart();
        var watcher = setInterval(function() {
          if (!imgLoaded) { return; }
          clearInterval(watcher);
          Ember.Test.adapter.asyncEnd();
          Ember.run(null, resolve);
        }, 10);
      });
    }

    __exports__["default"] = imageLoaded;
  });
;define("wait_for", 
  ["exports"],
  function(__exports__) {
    "use strict";
    function waitFor(app, time) {

      if(typeof app === 'number') {
        time = app;
      }

      return new Ember.RSVP.Promise(function(resolve) {
        Ember.Test.adapter.asyncStart();
        var watcher = setTimeout(function() {
          Ember.Test.adapter.asyncEnd();
          Ember.run(null, resolve);
        }, time);
      });
    }

    __exports__["default"] = waitFor;
  });
;define("build_data_blob", 
  ["exports"],
  function(__exports__) {
    "use strict";
    function buildDataBlob(file) {
      if( typeof Blob === 'function' ) {
        return new Blob([file], { type: 'image/png' });
      }
      else {
        var b = new window.WebKitBlobBuilder;
        b.append([file]);
        return b.getBlob('image/png');
      }
    }

    __exports__["default"] = buildDataBlob;
  });
;define("component_for", 
  ["isolated_container","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var isolatedContainer = __dependency1__["default"];

    var get = Ember.get;

    __exports__["default"] = function componentFor(name, data, deps, _yield, options) {
      var fullName = 'component:' + name,
          needs = [fullName].concat(deps || []),
          container = isolatedContainer(needs);
      
      Ember.setupForTesting();

      var append = function() {
        var containerView = Ember.ContainerView.create({ 
          container: container 
        });

        var view = Ember.run(function() {

          var component = container.lookup('component:' + name);

          //we manually inject store into all our components so this is a nice way of keeping the store available for the component
          component.reopen({
            store: container.lookup('store:main')
          });
          
          var subject = component.create(data);

          subject.dispatcher = Ember.EventDispatcher.create();
          subject.dispatcher.setup({}, '#ember-testing');

          subject.reopen({
            destroy: function() {
              this._super();
              this.dispatcher.destroy();
              containerView.destroy();
            }
          });

          containerView.pushObject(subject);
          containerView.appendTo('#ember-testing');

          return subject;
        });
        
        return view;
      
      };

      return append();
    }
  });
;define("isolated_container", 
  ["ember/resolver","quad/router","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var Resolver = __dependency1__["default"];
    var Router = __dependency2__["default"];

    __exports__["default"] = function isolatedContainer(fullNames) {
      var container = new Ember.Container();

      container.optionsForType('component', { singleton: false, instantiate: false });
      container.optionsForType('view', { singleton: false, instantiate: false  });
      container.optionsForType('template', { instantiate: false });
      container.optionsForType('helper', { instantiate: false });
      container.optionsForType('model', { instantiate: false });
      container.register('component-lookup:main', Ember.ComponentLookup);

      DS.FixtureAdapter.reopen({
        simulateRemoteResponse: false
      });

      Router.reopen({
        location: 'none'
      });

      container.register('store:main', DS.Store);
      container.register('adapter:application', DS.FixtureAdapter);
      container.register('serializer:application', DS.JSONSerializer);
      container.register('transform:boolean', DS.BooleanTransform);
      container.register('transform:string', DS.StringTransform);
      container.register('transform:number', DS.NumberTransform);
      container.register('transform:date', DS.DateTransform);
      container.register('location:none', Ember.NoneLocation);
      container.register('router:main', Router);

      var resolver = Resolver['default'].create();

      resolver.namespace = {
        modulePrefix: 'quad'
      };
    //console.log(fullNames)
      for (var i = fullNames.length; i > 0; i--) {
        var fullName = fullNames[i - 1],
            resolved = resolver.resolve(fullName);

        if(fullName.match(/transform:/)) {
          fullName = fullName.camelize();
        }
        container.register(fullName, resolved);

        /* automatically register component template if one exists */
        if(fullName.match(/component:/)) {
          var componentTemplate = 'template:components/' + fullName.split(':')[1];
          if(resolver.resolve(componentTemplate)) {
            container.register(componentTemplate, resolver.resolve(componentTemplate));
            container.injection(fullName, 'layout', componentTemplate);
          }
        }

      }

      return container;
    }
  });
;define("create_image_url", 
  ["exports"],
  function(__exports__) {
    "use strict";
    __exports__["default"] = function createImageUrl(width, height, src) {

      var image = new Image(100, 100);
      image.width = width ? width : 100;
      image.height = height ? height : 100;
      if(src) {
        image.src = src;
      }

      var canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;

      var ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0);

      return canvas.toDataURL("image/png");
    }
  });
;define("model_for", 
  ["isolated_container","ember/resolver","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var isolatedContainer = __dependency1__["default"];
    var Resolver = __dependency2__["default"];

    var resolver = Resolver['default'].create();
    resolver.namespace = {
      modulePrefix: 'quad'
    };

    function modelFor(name, deps, options) {

      var fullName = 'model:' + name,
          needs = [fullName].concat(deps || []),
          container = isolatedContainer(needs);

      DS.Model.reopen({
        destroy: function() {
          this._super();
          container.destroy();
        }
      });

      //grab adapters and serializers for needed models if they exist
      /*
      needs.forEach(function(key) {

        var modelName = key.split('model:')[1],
            adapter = resolver.resolve('adapter:' + modelName),
            serializer = resolver.resolve('serializer:' + modelName);

        if(adapter) {
          container.register('adapter:' + modelName, adapter);
        }
        if(serializer) {
          container.register('serializer:' + modelName, serializer);
        }
      });
      */

      return Ember.run(function() { 
        var method = options && options.id ? 'push' : 'createRecord'
        return container.lookup('store:main')[method](name, options || {}); 
      });
    }

    __exports__["default"] = modelFor;
  });
;define("start_app", 
  ["quad/app","quad/router","image_loaded","wait_for","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    "use strict";
    var Application = __dependency1__["default"];
    var Router = __dependency2__["default"];
    var imageLoadedHelper = __dependency3__["default"];

    var waitFor = __dependency4__["default"];


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

    __exports__["default"] = startApp;
  });