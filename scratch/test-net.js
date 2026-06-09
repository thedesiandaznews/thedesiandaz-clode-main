const net = require('net');

const host = 'ep-little-river-apd6cjiu.c-7.us-east-1.aws.neon.tech';
const port = 5432;

console.log(`Testing TCP connection to ${host}:${port} using Node.js net...`);

const socket = net.createConnection(port, host, () => {
  console.log('Successfully connected!');
  socket.end();
});

socket.on('error', (err) => {
  console.error('Connection failed:', err);
});

socket.setTimeout(5000, () => {
  console.log('Connection timed out after 5 seconds');
  socket.destroy();
});
