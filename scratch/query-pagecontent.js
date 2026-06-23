const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Query local SQLite for PageContent
process.env.DATABASE_URL = `file:${path.join(__dirname, '../dev.db')}`;

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL
});

async function main() {
  console.log("Checking local SQLite PageContent...");
  
  // Wait, the prisma schema is postgresql, so prisma client will error on sqlite URL unless we use direct raw prisma connection or just inspect the file directly using sqlite3 package!
  // Yes! The sqlite3 or better-sqlite3 package is installed. Let's use better-sqlite3 to inspect the dev.db directly without Prisma!
  const Database = require('better-sqlite3');
  const db = new Database(path.join(__dirname, '../dev.db'));

  const rows = db.prepare("SELECT pageSlug, length(content) as len FROM PageContent").all();
  console.log("PageContent rows:", rows);

  db.close();
}

main().catch(console.error);
