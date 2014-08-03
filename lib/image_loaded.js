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

export default imageLoaded;
