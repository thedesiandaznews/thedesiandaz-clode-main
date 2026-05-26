const Jimp = require('jimp');
console.log('Jimp keys:', Object.keys(Jimp));
if (Jimp.Jimp) {
  console.log('Jimp.Jimp keys:', Object.keys(Jimp.Jimp));
}
