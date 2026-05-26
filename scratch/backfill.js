const Database = require('better-sqlite3');
const path = require('path');

async function main() {
  const dbPath = path.join(__dirname, '../dev.db');
  console.log('Connecting to SQLite database at:', dbPath);
  
  const db = new Database(dbPath);
  
  try {
    // 1. Fetch all reporters ordered by createdAt
    const reporters = db.prepare('SELECT id, fullName, reporterCode, createdAt FROM Reporter ORDER BY createdAt ASC').all();
    console.log(`Found ${reporters.length} reporters in database.`);

    db.transaction(() => {
      let updatedCount = 0;
      for (let i = 0; i < reporters.length; i++) {
        const rep = reporters[i];
        
        // Determine year/month from createdAt
        const createdAtMs = rep.createdAt; // SQLite store date as float or string or ISO
        let date = new Date();
        if (createdAtMs) {
          date = new Date(createdAtMs);
        }
        
        const yy = String(date.getFullYear()).slice(-2);
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const serial = String(i + 1).padStart(4, '0');
        const expectedCode = `TDA/${yy}/${mm}/${serial}`;

        if (rep.reporterCode !== expectedCode) {
          db.prepare('UPDATE Reporter SET reporterCode = ? WHERE id = ?').run(expectedCode, rep.id);
          console.log(`Updated reporter "${rep.fullName}" [ID: ${rep.id}] -> ${expectedCode}`);
          updatedCount++;
        } else {
          console.log(`Reporter "${rep.fullName}" already has correct ID: ${expectedCode}`);
        }
      }
      console.log(`Transaction successful. Updated ${updatedCount} records.`);
    })();

  } catch (error) {
    console.error('Error during direct backfill migration:', error);
  } finally {
    db.close();
    console.log('Database connection closed.');
  }
}

main();
