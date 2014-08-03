export default function createImageUrl(width, height, src) {

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
