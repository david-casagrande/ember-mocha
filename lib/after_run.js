var asyncCount = 0;
var callbackQueue = [];
export default function afterRun(callback) {
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
