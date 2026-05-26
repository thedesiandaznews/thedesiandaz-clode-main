const Database = require('better-sqlite3');
const db = new Database('./dev.db');

const row = db.prepare('SELECT * FROM SiteSetting').all();
console.log(row);

db.prepare(`
  INSERT INTO SiteSetting (id, "key", "value") VALUES ('adminId_1', 'adminId', 'ThedesiandazNews')
  ON CONFLICT("key") DO UPDATE SET "value"='ThedesiandazNews'
`).run();

db.prepare(`
  INSERT INTO SiteSetting (id, "key", "value") VALUES ('adminPwd_1', 'adminPassword', 'Thedesiandaz@3820')
  ON CONFLICT("key") DO UPDATE SET "value"='Thedesiandaz@3820'
`).run();

console.log("Updated!");
const row2 = db.prepare('SELECT * FROM SiteSetting').all();
console.log(row2);
