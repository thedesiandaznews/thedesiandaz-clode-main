const net = require('net');

const host = '52.4.160.253';
const port = 5432;

console.log(`Testing TCP connection to IPv4 ${host}:${port}...`);
const socket = new net.Socket();
socket.setTimeout(5000);

socket.connect(port, host, () => {
  console.log('Successfully connected to the database port via IPv4!');
  socket.destroy();
});

socket.on('error', (err) => {
  console.error('Connection error:', err);
});

socket.on('timeout', () => {
  console.error('Connection timed out');
  socket.destroy();
});
