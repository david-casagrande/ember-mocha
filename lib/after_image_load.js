export default function afterImageLoad(image, callback) {
  
  var imgLoaded = new Image();
  imgLoaded.onload = function() {
    return callback();
  }
  imgLoaded.src = image;
}

