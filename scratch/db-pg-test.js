const { Client } = require('pg');

const connectionString = "postgresql://neondb_owner:npg_Oqm2SWtDVXdQ@ep-little-river-apd6cjiu.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function main() {
  console.log("Connecting to Postgres via pg client...");
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 10000,
  });

  await client.connect();
  console.log("Connected successfully!");

  const res = await client.query("SELECT COUNT(*) FROM \"Article\"");
  console.log("Articles count:", res.rows[0].count);

  const resCat = await client.query("SELECT COUNT(*) FROM \"Category\"");
  console.log("Categories count:", resCat.rows[0].count);

  const resRep = await client.query("SELECT COUNT(*) FROM \"Reporter\"");
  console.log("Reporters count:", resRep.rows[0].count);

  await client.end();
}

main().catch(console.error);
