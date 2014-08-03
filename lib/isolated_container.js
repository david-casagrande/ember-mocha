import Resolver from 'ember/resolver';
import Router from 'quad/router';

export default function isolatedContainer(fullNames) {
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
