import {client, connectClientAsync, waitMessage, writeMessage} from "./client.js";
import crypto from "crypto";
import {getSessionKey, importRsaPublicKey} from "../utils.js";
import readline from "node:readline";
import * as Scrypt from "scrypt-kdf";

await connectClientAsync('127.0.0.1',6969);


const clientSecret = crypto.randomBytes(16);
writeMessage(clientSecret)
const serverHello = await waitMessage()
const [serverSecret, publicKey] = serverHello.toString().split("::");
console.log("Server hello", serverSecret);
console.log("Public key", publicKey,'\n');
const strKey = publicKey.toString()
const key = await importRsaPublicKey(strKey);

const preMaster = crypto.randomBytes(16);

console.log("PreMaster", preMaster.toString('base64'), '\n');
const encodedPreMaster = crypto.publicEncrypt(key, preMaster)
writeMessage(encodedPreMaster)

const sessionKeyData = getSessionKey(Buffer.from(serverSecret, 'base64'), clientSecret, preMaster);

const hash = crypto.createHash('sha256')
hash.update(sessionKeyData)
const sessionKey = hash.digest()
// const sessionKey = await Scrypt.kdf(sessionKeyData.toString('base64'), { logN: 15 });
console.log("Session key", sessionKeyData.toString('base64'), '\n');


sendMessage("Client Ready")

const ready = await waitMessage();
const readyDecoded = readMessage(ready)
console.log(readyDecoded);
console.log("---------------------Encrypted-chat-started--------------------------")

const rl = readline.createInterface({
  input: process.stdin,
});

rl.on('line', (line) => {
  sendMessage(line);
})
client.on('data', (data) => console.log(readMessage(data),'\t\t\t',data.toString('hex')));


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

function readMessage (message) {
  const algorithm = 'aes-256-cbc';
  const iv = message.subarray(0, 16);
  const payload = message.subarray(16, message.length);
  const decipher  = crypto.createDecipheriv(algorithm, sessionKey, iv)
  let decrypted = decipher.update(payload.toString(), 'hex', "utf-8")
  decrypted += decipher.final('utf-8')
  return decrypted
}