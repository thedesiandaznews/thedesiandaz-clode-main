const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../dev.db');
console.log('Connecting to database at:', dbPath);

const db = new Database(dbPath);

try {
  // Get table info for Article
  const columns = db.prepare("PRAGMA table_info(Article);").all();
  console.log('--- Article Table Columns ---');
  columns.forEach(col => {
    console.log(`${col.name}: type=${col.type}, notnull=${col.notnull}, dflt_value=${col.dflt_value}`);
  });

  // Get count and status of articles
  const countByStatus = db.prepare("SELECT status, COUNT(*) as count FROM Article GROUP BY status;").all();
  console.log('\n--- Article Count by Status ---');
  console.log(countByStatus);

  // Get a few articles
  const articles = db.prepare("SELECT id, title, status, editCount, reporterId, categoryId FROM Article LIMIT 5;").all();
  console.log('\n--- Sample Articles ---');
  console.log(articles);

} catch (error) {
  console.error('Error during diagnostics:', error);
} finally {
  db.close();
}
