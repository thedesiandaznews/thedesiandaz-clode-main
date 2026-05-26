const fs = require('fs');
const path = require('path');

function searchCssFiles(dir) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        searchCssFiles(fullPath);
      }
    } else if (file.endsWith('.css')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('Wrapper') || content.includes('banner') || content.includes('Banner')) {
        console.log(`Found in: ${fullPath.substring(process.cwd().length)}`);
      }
    }
  });
}

searchCssFiles(process.cwd());
