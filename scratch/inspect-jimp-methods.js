const Jimp = require('jimp');
console.log('JimpMime:', Jimp.JimpMime);
const jimpInstance = new Jimp.Jimp({ width: 10, height: 10 });
console.log('Jimp instance keys:', Object.keys(jimpInstance));
console.log('Jimp prototype keys:', Object.getOwnPropertyNames(Object.getPrototypeOf(jimpInstance)));
