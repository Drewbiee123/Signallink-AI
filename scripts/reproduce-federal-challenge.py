#!/usr/bin/env python3
import hashlib
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
VECTOR_PATH = ROOT / "public" / "challenges" / "federal-repro-v1.json"


def canonicalize(value):
    if value is None:
        return "null"
    if value is True:
        return "true"
    if value is False:
        return "false"
    if isinstance(value, (int, float)):
        return json.dumps(value, separators=(",", ":"), ensure_ascii=False)
    if isinstance(value, str):
        return json.dumps(value, ensure_ascii=False)
    if isinstance(value, list):
        return "[" + ",".join(canonicalize(item) for item in value) + "]"
    if isinstance(value, dict):
        return "{" + ",".join(
            json.dumps(key, ensure_ascii=False) + ":" + canonicalize(value[key])
            for key in sorted(value.keys())
        ) + "}"
    raise TypeError(f"Unsupported JSON type: {type(value)!r}")


with VECTOR_PATH.open("r", encoding="utf-8") as handle:
    vector = json.load(handle)

payload = vector["payload"]
expected = vector["expected_sha256"]
canonical = canonicalize(payload)
actual = hashlib.sha256(canonical.encode("utf-8")).hexdigest()

print("SignalLink Public Reproducibility Challenge #1")
print("Implementation: Python standard library")
print(f"Canonical: {canonical}")
print(f"Expected:  {expected}")
print(f"Actual:    {actual}")

if actual != expected:
    print("RESULT: FAIL")
    sys.exit(1)

print("RESULT: PASS")
