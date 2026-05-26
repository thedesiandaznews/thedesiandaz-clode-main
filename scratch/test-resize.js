const Jimp = require('jimp');

async function main() {
  try {
    // Create a 10x10 red image
    const image = new Jimp.Jimp({ width: 10, height: 10, color: 0xFF0000FF });
    console.log('Original size:', image.width, 'x', image.height);
    
    // Scale by 5X
    image.scale(5);
    console.log('Scaled size:', image.width, 'x', image.height);
    
    // Get buffer
    const buffer = await image.getBuffer(Jimp.JimpMime.png);
    console.log('Buffer successfully retrieved, length:', buffer.length);
  } catch (e) {
    console.error('Error:', e);
  }
}

main();
