const http = require('http');

http.get('http://localhost:3000/local', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    // try to find the error message from nextjs payload
    const match = data.match(/\"message\"\:\"(.*?)\"/);
    if (match) {
      console.log('NEXTJS ERROR:', match[1]);
    } else {
      console.log('FULL PAYLOAD:', data.substring(0, 2000));
    }
  });
});
