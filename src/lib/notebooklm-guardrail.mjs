import { createHash } from "node:crypto";

const digestPattern = /^[0-9a-f]{64}$/;
const keysEqual = (value, expected) =>
  Object.keys(value).sort().join("\0") === expected.slice().sort().join("\0");
const plainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (plainObject(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

/** Validate a caller-supplied manifest and compute a local, unsigned digest. */
export function prepareNotebookLMManifest(manifest) {
  if (!plainObject(manifest) || !keysEqual(manifest, ["schema_version", "workflow_id", "captured_at", "sources", "answer_sha256"])) {
    throw new TypeError("Invalid manifest fields");
  }
  if (manifest.schema_version !== "1.0" || typeof manifest.workflow_id !== "string" ||
      manifest.workflow_id.length < 1 || manifest.workflow_id.length > 200 ||
      typeof manifest.captured_at !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(manifest.captured_at) ||
      !Number.isFinite(Date.parse(manifest.captured_at)) ||
      typeof manifest.answer_sha256 !== "string" || !digestPattern.test(manifest.answer_sha256) ||
      !Array.isArray(manifest.sources) || manifest.sources.length === 0) {
    throw new TypeError("Invalid manifest values");
  }
  const ids = new Set();
  for (const source of manifest.sources) {
    if (!plainObject(source) || !keysEqual(source, ["source_id", "content_sha256"]) ||
        typeof source.source_id !== "string" || source.source_id.length < 1 || source.source_id.length > 500 ||
        typeof source.content_sha256 !== "string" || !digestPattern.test(source.content_sha256) ||
        ids.has(source.source_id)) throw new TypeError("Invalid source entry");
    ids.add(source.source_id);
  }
  const canonical_json = canonical(manifest);
  return { status: "prepared", canonical_json, sha256: createHash("sha256").update(canonical_json).digest("hex") };
}
