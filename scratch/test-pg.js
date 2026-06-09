const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
console.log('Connecting to:', connectionString.replace(/:[^:@]+@/, ':****@')); // mask password

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false // accept self-signed or Neon certificates
  }
});

client.connect()
  .then(() => {
    console.log('Connected successfully via pg!');
    return client.query('SELECT NOW(), version();');
  })
  .then(res => {
    console.log('Query result:', res.rows[0]);
    return client.end();
  })
  .catch(err => {
    console.error('Connection or query failed:', err);
  });
