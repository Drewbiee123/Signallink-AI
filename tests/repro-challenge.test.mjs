import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";

function canonicalize(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(",")}}`;
}

test("public federal reproducibility vector matches published canonical string and SHA-256", () => {
  const path = new URL("../public/challenges/federal-repro-v1.json", import.meta.url);
  const challenge = JSON.parse(fs.readFileSync(path, "utf8"));
  const canonical = canonicalize(challenge.payload);
  const digest = crypto.createHash("sha256").update(canonical, "utf8").digest("hex");
  assert.equal(canonical, challenge.expected_canonical);
  assert.equal(digest, challenge.expected_sha256);
});
