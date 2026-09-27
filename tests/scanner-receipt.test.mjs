import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { spawnSync } from "node:child_process";

function canonicalize(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(",")}}`;
}

test("offline receipt verifier accepts authentic media and rejects changed bytes", () => {
  const folder = mkdtempSync(join(tmpdir(), "slk-media-"));
  try {
    const { privateKey, publicKey } = generateKeyPairSync("ed25519");
    const pem = publicKey.export({ type: "spki", format: "pem" }).toString();
    const media = Buffer.from("test media bytes");
    const timestamp = "2026-09-26T18:00:00.000Z";
    const digest = bytes => createHash("sha256").update(bytes).digest("hex");
    const payload = { scanned_at: timestamp, file: { sha256: digest(media) }, signing_key_sha256: digest(pem) };
    const hash = digest(canonicalize(payload));
    const receipt = { payload, timestamp, hash, signature: sign(null, Buffer.from(`${hash}|${timestamp}`), privateKey).toString("base64") };
    const paths = ["receipt.json", "file.png", "key.pem"].map(name => join(folder, name));
    writeFileSync(paths[0], JSON.stringify(receipt)); writeFileSync(paths[1], media); writeFileSync(paths[2], pem);
    const verifier = resolve("public/verify-media-receipt.mjs");
    const good = spawnSync(process.execPath, [verifier, ...paths], { encoding: "utf8" });
    assert.equal(good.status, 0, good.stderr);
    assert.equal(JSON.parse(good.stdout).status, "VALID");
    writeFileSync(paths[1], "changed media bytes");
    const bad = spawnSync(process.execPath, [verifier, ...paths], { encoding: "utf8" });
    assert.equal(bad.status, 1);
    assert.equal(JSON.parse(bad.stdout).checks.file_hash_matches, false);
  } finally { rmSync(folder, { recursive: true, force: true }); }
});
