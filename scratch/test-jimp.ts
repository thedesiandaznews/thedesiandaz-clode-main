import Jimp from 'jimp';

async function main() {
  console.log('Jimp version/import is successful!');
  console.log('MIME_PNG:', Jimp.MIME_PNG);
}

main().catch(console.error);
