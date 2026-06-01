const encoder = new TextEncoder();
const decoder = new TextDecoder();
const SALT = "dashboard-app-auth-salt-v1";
const ITERATIONS = 200000;

function encodeBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}

function decodeBase64(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveKey(password) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(SALT),
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptData(data, password) {
  const key = await deriveKey(password);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plainText = encoder.encode(JSON.stringify(data));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plainText
  );

  return `${encodeBase64(iv)}:${encodeBase64(encrypted)}`;
}

export async function decryptData(payload, password) {
  const [ivBase64, encryptedBase64] = payload.split(":");
  if (!ivBase64 || !encryptedBase64) {
    throw new Error("Payload invalide");
  }

  const key = await deriveKey(password);
  const iv = decodeBase64(ivBase64);
  const encryptedBytes = decodeBase64(encryptedBase64);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encryptedBytes
  );

  return JSON.parse(decoder.decode(decrypted));
}
