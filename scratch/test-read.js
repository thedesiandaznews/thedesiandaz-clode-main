const Jimp = require('jimp');

async function main() {
  try {
    const dummyImage = new Jimp.Jimp({ width: 10, height: 10, color: 0xFF0000FF });
    const buffer = await dummyImage.getBuffer(Jimp.JimpMime.png);
    
    // Test reading
    const readImage = await Jimp.Jimp.read(buffer);
    console.log('Read image size:', readImage.width, 'x', readImage.height);
  } catch (e) {
    console.error('Error during read:', e);
  }
}

main();
