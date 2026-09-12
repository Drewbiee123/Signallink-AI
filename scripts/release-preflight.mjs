import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import * as yaml from "js-yaml";

const root = process.cwd();
const staticOnly = process.argv.includes("--static-only");
const failures = [];

function fail(message) {
  failures.push(message);
}

function run(command, args) {
  console.log(`\n[preflight] ${command} ${args.join(" ")}`);
  execFileSync(command, args, { cwd: root, stdio: "inherit", env: process.env });
}

const packageJson = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const lock = JSON.parse(readFileSync(path.join(root, "package-lock.json"), "utf8"));
const lockedRoot = lock.packages?.[""];

if (!lockedRoot) fail("package-lock.json is missing its root package record");
for (const section of ["dependencies", "devDependencies"]) {
  const declared = packageJson[section] || {};
  const locked = lockedRoot?.[section] || {};
  for (const [name, version] of Object.entries(declared)) {
    if (locked[name] !== version) fail(`${section}.${name} differs between package.json and package-lock.json`);
  }
}

if (Number(process.versions.node.split(".")[0]) !== 24) {
  fail(`Node 24 is required; running ${process.version}`);
}

const workflowDir = path.join(root, ".github", "workflows");
const workflowFiles = readdirSync(workflowDir).filter((name) => name.endsWith(".yml")).sort();
const usesPattern = /uses:\s*[^@\s]+@([^\s#]+)/g;

for (const name of workflowFiles) {
  const file = path.join(workflowDir, name);
  const source = readFileSync(file, "utf8");
  try {
    yaml.load(source);
  } catch (error) {
    fail(`${name} is invalid YAML: ${error.message}`);
  }
  if (!/^permissions:\s*read-all\s*$/m.test(source)) {
    fail(`${name} must default to permissions: read-all`);
  }
  for (const match of source.matchAll(usesPattern)) {
    if (!/^[0-9a-f]{40}$/.test(match[1])) fail(`${name} contains an unpinned action reference: ${match[0]}`);
  }
}

for (const route of [
  "src/app/api/health/route.ts",
  "src/app/api/anchor/create/route.ts",
  "src/app/api/anchor/verify/route.ts",
  "src/app/api/checkout/route.ts"
]) {
  try {
    readFileSync(path.join(root, route));
  } catch {
    fail(`Required release boundary is missing: ${route}`);
  }
}

if (failures.length) {
  console.error("\nRELEASE PREFLIGHT BLOCKED");
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}

console.log(`[preflight] Static integrity passed for ${workflowFiles.length} workflows.`);
if (!staticOnly) {
  run("npm", ["audit", "--omit=dev", "--audit-level=moderate"]);
  run("npm", ["test"]);
  run("npm", ["run", "validate:genesis"]);
  run("npm", ["run", "build"]);
}
console.log("\nRELEASE PREFLIGHT PASSED");
