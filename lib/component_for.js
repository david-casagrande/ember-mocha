import isolatedContainer from './isolated_container';

var get = Ember.get;

export default function componentFor(name, data, deps, _yield, options) {
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
