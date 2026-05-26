const fs = require('fs');
const path = require('path');

function searchComponents(dir) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        searchComponents(fullPath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('ad-image') || content.includes('ad-container') || content.includes('ad-image-wrapper')) {
        console.log(`Found in: ${fullPath.substring(process.cwd().length)}`);
      }
    }
  });
}

searchComponents(process.cwd());
