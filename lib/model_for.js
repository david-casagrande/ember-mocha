import isolatedContainer from './isolated_container';
import Resolver from 'ember/resolver';

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

export default modelFor;
