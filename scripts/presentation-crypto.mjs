import { randomBytes, webcrypto } from "node:crypto";

export const PRESENTATION_MAGIC = Buffer.from("ICAIFP01", "ascii");
export const DEFAULT_ITERATIONS = 600_000;
const HEADER_LENGTH = 40;

async function deriveKey(password, salt, iterations, usage) {
  const material = await webcrypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return webcrypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    [usage],
  );
}

export async function encryptPresentation(plainBytes, password, salt = randomBytes(16), iterations = DEFAULT_ITERATIONS) {
  if (!password) throw new Error("A password is required.");
  if (salt.byteLength !== 16) throw new Error("The salt must contain 16 bytes.");
  const iv = randomBytes(12);
  const key = await deriveKey(password, salt, iterations, "encrypt");
  const ciphertext = new Uint8Array(await webcrypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plainBytes));
  const iterationBytes = Buffer.alloc(4);
  iterationBytes.writeUInt32BE(iterations);
  return Buffer.concat([PRESENTATION_MAGIC, Buffer.from(salt), iv, iterationBytes, Buffer.from(ciphertext)]);
}

export async function decryptPresentation(encryptedBytes, password) {
  const bytes = Buffer.from(encryptedBytes);
  if (bytes.length < HEADER_LENGTH + 16 || !bytes.subarray(0, 8).equals(PRESENTATION_MAGIC)) {
    throw new Error("Invalid encrypted presentation.");
  }
  const salt = bytes.subarray(8, 24);
  const iv = bytes.subarray(24, 36);
  const iterations = bytes.readUInt32BE(36);
  if (iterations < 100_000 || iterations > 2_000_000) throw new Error("Invalid password settings.");
  const key = await deriveKey(password, salt, iterations, "decrypt");
  const plaintext = await webcrypto.subtle.decrypt({ name: "AES-GCM", iv }, key, bytes.subarray(HEADER_LENGTH));
  return Buffer.from(plaintext);
}
