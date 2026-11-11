import { randomBytes } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { encryptPresentation } from "./presentation-crypto.mjs";

const presentations = [
  "anastasia-borovykh",
  "orderflowdit",
  "beyond-supra-competitive-outcomes",
  "herding-or-racing",
  "same-exposure-different-clocks",
  "chat2lob",
  "when-proofs-are-abundant",
];
const inputDirectory = resolve("private-presentations");
const outputDirectory = resolve("public/presentations/encrypted");

function readHidden(prompt) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
    throw new Error("Run this command in an interactive terminal so the password is not echoed.");
  }
  return new Promise((resolvePromise, rejectPromise) => {
    const input = process.stdin;
    let value = "";
    let finished = false;
    const finish = (error) => {
      if (finished) return;
      finished = true;
      input.removeListener("data", onData);
      input.setRawMode(false);
      input.pause();
      process.stdout.write("\n");
      if (error) rejectPromise(error);
      else resolvePromise(value);
    };
    const onData = (chunk) => {
      for (const character of chunk.toString("utf8")) {
        if (character === "\u0003") return finish(new Error("Cancelled."));
        if (character === "\r" || character === "\n") return finish();
        if (character === "\u007f" || character === "\b") value = value.slice(0, -1);
        else if (character >= " ") value += character;
      }
    };
    process.stdout.write(prompt);
    input.setRawMode(true);
    input.resume();
    input.on("data", onData);
  });
}

async function main() {
  const sources = await Promise.all(presentations.map(async (id) => {
    const path = resolve(inputDirectory, `${id}.pdf`);
    try { await access(path); }
    catch { throw new Error(`Missing source: private-presentations/${id}.pdf`); }
    const bytes = await readFile(path);
    if (!bytes.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
      throw new Error(`Not a PDF: private-presentations/${id}.pdf`);
    }
    return { id, bytes };
  }));

  const password = await readHidden("Choose a strong workshop password (20+ characters): ");
  if (password.length < 20) throw new Error("Use a passphrase of at least 20 characters.");
  const confirmation = await readHidden("Confirm the workshop password: ");
  if (password !== confirmation) throw new Error("The passwords do not match; no files were written.");

  const salt = randomBytes(16);
  await mkdir(outputDirectory, { recursive: true });
  for (const { id, bytes } of sources) {
    const encrypted = await encryptPresentation(bytes, password, salt);
    await writeFile(resolve(outputDirectory, `${id}.pdf.enc`), encrypted);
    process.stdout.write(`Encrypted ${id}.pdf\n`);
  }
  process.stdout.write("Done. Only the encrypted .enc files belong in the public repository.\n");
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
