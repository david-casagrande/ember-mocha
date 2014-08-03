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

export default waitFor;
