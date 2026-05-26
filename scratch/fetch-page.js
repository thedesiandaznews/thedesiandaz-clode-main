const http = require('http');

http.get('http://localhost:3000/', (res) => {
  console.log('STATUS:', res.statusCode);
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Done fetching. Length:', data.length);
  });
}).on('error', (err) => {
  console.error('Fetch error:', err);
});
