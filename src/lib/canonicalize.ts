function normalize(value: unknown, seen: WeakSet<object>): unknown {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("Payload numbers must be finite.");
    }
    return value;
  }
  if (typeof value === "bigint") {
    throw new TypeError("BigInt values are not supported in canonical payloads.");
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    if (seen.has(value)) throw new TypeError("Circular payloads are not supported.");
    seen.add(value);
    const normalized = value.map((item) =>
      item === undefined || typeof item === "function" || typeof item === "symbol"
        ? null
        : normalize(item, seen)
    );
    seen.delete(value);
    return normalized;
  }
  if (typeof value === "object") {
    const object = value as Record<string, unknown>;
    if (seen.has(object)) throw new TypeError("Circular payloads are not supported.");
    seen.add(object);
    const normalized: Record<string, unknown> = {};
    for (const key of Object.keys(object).sort()) {
      const item = object[key];
      if (item !== undefined && typeof item !== "function" && typeof item !== "symbol") {
        normalized[key] = normalize(item, seen);
      }
    }
    seen.delete(object);
    return normalized;
  }
  throw new TypeError(`Unsupported payload value: ${typeof value}`);
}

export function canonicalize(value: unknown): string {
  return JSON.stringify(normalize(value, new WeakSet()));
}
