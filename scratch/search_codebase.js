const fs = require('fs');
const path = require('path');

const rootDir = "c:\\Users\\sonuk\\OneDrive\\Desktop\\Thedesiandaz-clode";

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules' && file !== '.next') {
        results = results.concat(walk(fullPath));
      }
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.json')) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const files = walk(rootDir);
console.log(`Searching through ${files.length} files...`);

const keywords = ["चुनाव आयोग", "विराट कोहली", "महीना भर न हुआ", "कांग्रेशनल रिसर्च"];

files.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf-8');
    keywords.forEach(kw => {
      if (content.includes(kw)) {
        console.log(`Found "${kw}" in ${path.relative(rootDir, file)}`);
      }
    });
  } catch(e) {}
});
