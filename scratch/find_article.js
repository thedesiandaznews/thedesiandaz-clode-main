const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../dev.db');
const db = new Database(dbPath);

try {
  const cat = db.prepare("SELECT * FROM Category WHERE id = 'cmon53ygw00088ss20j7zd9z1';").get();
  console.log('Category query result:', cat);
  
  const allCats = db.prepare("SELECT id, name FROM Category;").all();
  console.log('All available categories in DB:', allCats);
} catch (err) {
  console.error('Error:', err);
} finally {
  db.close();
}
