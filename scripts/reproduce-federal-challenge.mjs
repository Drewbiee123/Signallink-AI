import fs from "node:fs";
import crypto from "node:crypto";

function canonicalize(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(",")}}`;
}

const path = new URL("../public/challenges/federal-repro-v1.json", import.meta.url);
const challenge = JSON.parse(fs.readFileSync(path, "utf8"));
const canonical = canonicalize(challenge.payload);
const digest = crypto.createHash("sha256").update(canonical, "utf8").digest("hex");
const canonicalMatch = canonical === challenge.expected_canonical;
const hashMatch = digest === challenge.expected_sha256;

console.log("SignalLink Public Reproducibility Challenge #1");
console.log(`Challenge: ${challenge.challenge_id}`);
console.log(`Canonical match: ${canonicalMatch ? "PASS" : "FAIL"}`);
console.log(`SHA-256 match: ${hashMatch ? "PASS" : "FAIL"}`);
console.log(`Computed SHA-256: ${digest}`);
console.log(`Expected SHA-256: ${challenge.expected_sha256}`);
console.log(`Result: ${canonicalMatch && hashMatch ? "PASS" : "FAIL"}`);
console.log("");
console.log("Scope: deterministic cross-implementation reproduction only; no government or third-party certification/endorsement is implied.");

if (!canonicalMatch || !hashMatch) process.exitCode = 1;
