import {Socket} from "node:net";


export const client = new Socket();
// client.connect(6969, '127.0.0.1', function() {
//   client.write('Hello, server! Love, Client.');
// });

export const connectClient = (host, port, callback) => client.connect(port, host, callback);

export const connectClientAsync = async (host, port) => new Promise(resolve => client.connect(port, host, () => resolve()));

export const waitMessage = () =>
  new Promise(resolve => client.on('data', resolve));

export const writeMessage = (message) => client.write(message);