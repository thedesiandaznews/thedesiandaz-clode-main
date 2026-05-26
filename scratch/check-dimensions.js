const fs = require('fs');
const path = require('path');

const uploadDir = path.join(process.cwd(), "public", "uploads", "banners");

function getPngDimensions(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    // Check if it's a PNG
    if (buffer.toString('ascii', 1, 4) === 'PNG') {
      const width = buffer.readInt32BE(16);
      const height = buffer.readInt32BE(20);
      return { width, height };
    }
  } catch (e) {}
  return null;
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (file.endsWith('.png')) {
      const dim = getPngDimensions(fullPath);
      if (dim) {
        console.log(`${fullPath.substring(process.cwd().length)}: ${dim.width}x${dim.height}px`);
      } else {
        console.log(`${fullPath.substring(process.cwd().length)}: (not a PNG or error)`);
      }
    }
  });
}

walkDir(uploadDir);
