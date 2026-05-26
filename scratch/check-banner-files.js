const fs = require('fs');
const path = require('path');

const uploadDir = path.join(process.cwd(), "public", "uploads", "banners");

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else {
      console.log(`${fullPath.substring(process.cwd().length)}: ${stat.size} bytes`);
    }
  });
}

walkDir(uploadDir);
