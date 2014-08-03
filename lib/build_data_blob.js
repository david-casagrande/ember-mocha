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

export default buildDataBlob;
