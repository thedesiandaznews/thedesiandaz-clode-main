const Database = require('better-sqlite3');
const db = new Database('dev.db');

try {
  const ads = db.prepare('SELECT * FROM AdBanner').all();
  console.log(JSON.stringify(ads, null, 2));
} catch (e) {
  console.error(e);
} finally {
  db.close();
}
