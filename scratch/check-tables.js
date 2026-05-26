const Database = require('better-sqlite3');

function checkDb(path) {
  console.log(`Checking ${path}:`);
  try {
    const db = new Database(path);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log("Tables:", tables.map(t => t.name));
  } catch (e) {
    console.error(e.message);
  }
}

checkDb('./dev.db');
checkDb('./prisma/dev.db');
