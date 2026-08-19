const DEFAULT_MAX_BYTES = 1024 * 1024;
const DEFAULT_MAX_DEPTH = 64;
const DEFAULT_MAX_NODES = 20000;

export async function readJsonBody<T>(req: Request, maxBytes = DEFAULT_MAX_BYTES): Promise<T> {
  const contentLength = req.headers.get("content-length");
  if (contentLength && Number(contentLength) > maxBytes) throw new Error("PAYLOAD_TOO_LARGE");

  const text = await req.text();
  if (Buffer.byteLength(text, "utf8") > maxBytes) throw new Error("PAYLOAD_TOO_LARGE");

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("INVALID_JSON");
  }
}

export function assertJsonComplexity(value: unknown, maxDepth = DEFAULT_MAX_DEPTH, maxNodes = DEFAULT_MAX_NODES): void {
  let nodes = 0;

  function walk(current: unknown, depth: number): void {
    nodes += 1;
    if (nodes > maxNodes) throw new Error("PAYLOAD_TOO_COMPLEX");
    if (depth > maxDepth) throw new Error("PAYLOAD_TOO_DEEP");
    if (current === null || typeof current !== "object") return;

    if (Array.isArray(current)) {
      for (const item of current) walk(item, depth + 1);
      return;
    }

    for (const child of Object.values(current as Record<string, unknown>)) walk(child, depth + 1);
  }

  walk(value, 0);
}
