import {connect} from "./server.js";
import crypto from "crypto";
import {getSessionKey, privateDecrypt} from "../utils.js";
import {client, writeMessage} from "../client/client.js";
import * as readline from "node:readline";
import * as Scrypt from "scrypt-kdf";

connect( async (socket) => {
  const waitMessage = () =>
    new Promise(resolve => socket.on('data', resolve));
  socket.on('error', console.error);
  const writeMessage = (message) => socket.write(message);


  const clientSecret = await waitMessage();
  console.log("Client Hello", clientSecret.toString('base64'), '\n');
  const serverSecret = crypto.randomBytes(16);
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {modulusLength: 2048})
  const serverHello = serverSecret.toString('base64')
    + "::"
    + publicKey.export({type: 'spki', format: 'der',}).toString('base64');
  writeMessage(serverHello);

  const preMaster = await waitMessage();
  const decrypt = privateDecrypt(privateKey);
  const decodedPreMaster = decrypt(preMaster);
  console.log("PreMaster", decodedPreMaster.toString('base64'), '\n');

  const sessionKeyData = getSessionKey(serverSecret, clientSecret, decodedPreMaster);

  const hash = crypto.createHash('sha256')
  hash.update(sessionKeyData)
  const sessionKey = hash.digest();
  // const sessionKey = await Scrypt.kdf(sessionKeyData.toString('base64'), { logN: 15 });
  console.log("Session key", sessionKeyData.toString('base64'), '\n');


  const ready = await waitMessage();
  const readyDecoded = readMessage(ready)
  console.log(readyDecoded);
  if(readyDecoded === "Client Ready"){
    sendMessage("Server Ready")
  }
  console.log("---------------------Encrypted-chat-started--------------------------")

  const rl = readline.createInterface({
    input: process.stdin,
  });

  rl.on('line', (line) => {
    sendMessage(line);
  })
  socket.on('data', (data) => console.log(readMessage(data),'\t\t\t',data.toString('hex')));

  function readMessage (message) {
    const algorithm = 'aes-256-cbc';
    const iv = message.subarray(0, 16);
    const payload = message.subarray(16, message.length);
    const decipher  = crypto.createDecipheriv(algorithm, sessionKey, iv)
    let decrypted = decipher.update(payload.toString(), 'hex', "utf-8")
    decrypted += decipher.final('utf-8')
    return decrypted
  }

  function sendMessage(data){
    const algorithm = 'aes-256-cbc';
    const iv = crypto.randomBytes(16)

    const cipher = crypto.createCipheriv(algorithm, sessionKey, iv)
    let enc = cipher.update(data, 'utf-8', 'hex')
    enc += cipher.final('hex');
    const payload = Buffer.from(enc)
    const message = Buffer.concat([iv,payload]);
    writeMessage(message)
  }
})
