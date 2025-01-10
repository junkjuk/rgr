import {createServer} from "node:net";


const HOST = '0.0.0.0';
const PORT = 6969;

const server = createServer(
  // function(sock) {
  //
  // console.log('CONNECTED: ' + sock.remoteAddress +':'+ sock.remotePort);
  // sockets.push(sock);
  // sock.on('data', function(data) {
  //   console.log(data.toString());
  //   sock.write('You said "' + data + '"');
  // });
  //
  // sock.on('close', function(data) {
  //   console.log('CLOSED: ' + sock.remoteAddress +' '+ sock.remotePort);
  // });
  // }
);

export const connect = (callback) => server.on('connection', callback)

export const waitConnection = () =>
  new Promise(resolve => server.on('connection', resolve));

server.listen(PORT, HOST)


console.log('Server listening on ' + HOST +':'+ PORT);