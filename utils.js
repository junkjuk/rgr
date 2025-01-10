import crypto from "crypto";


export function str2ab(str) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

export async function importRsaPublicKey(pem) {
  const binaryDerString = atob(pem);
  const binaryDer = str2ab(binaryDerString);

  return await crypto.subtle.importKey(
    "spki",
    binaryDer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256"
    },
    true,
    ["encrypt"]
  );
}

export const privateDecrypt = (key) => (data) => crypto.privateDecrypt(key, data)

export const getSessionKey = (serverSecret, clientSecret, preMaster) =>
  Buffer.concat([serverSecret, clientSecret, preMaster]);

