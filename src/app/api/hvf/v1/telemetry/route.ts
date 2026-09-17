import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { canonicalize } from "@/lib/canonicalize";
import { sha256hex } from "@/lib/hashing";

export const runtime = "nodejs";

const MAX_BYTES = 4096;
const MAX_AGE_MS = 30_000;
const NONCE_TTL_MS = 60_000;
const nonceCache = new Map<string, number>();

type HvfTelemetry = {
  gps: { latitude: number; longitude: number };
  altitude: number;
  battery: number;
  timestamp: string;
  nonce: string;
};

function reject(error: string, status: number) {
  return NextResponse.json({ verified: false, error }, { status });
}

function validNumber(v: unknown) { return typeof v === "number" && Number.isFinite(v); }

function cleanupNonces(now: number) {
  for (const [nonce, expires] of nonceCache) if (expires <= now) nonceCache.delete(nonce);
}

export async function POST(req: Request) {
  const secret = process.env.HVF_PHASE1_SHARED_SECRET;
  if (!secret) return reject("ingress not configured", 503);

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("application/json")) return reject("application/json required", 415);

  const declared = Number(req.headers.get("content-length") || "0");
  if (declared > MAX_BYTES) return reject("payload too large", 413);

  const raw = await req.text();
  if (Buffer.byteLength(raw, "utf8") > MAX_BYTES) return reject("payload too large", 413);

  let body: HvfTelemetry;
  try { body = JSON.parse(raw); } catch { return reject("invalid JSON", 400); }

  if (!body || typeof body !== "object" || Array.isArray(body)) return reject("invalid payload", 400);
  const keys = Object.keys(body).sort();
  if (keys.join(",") !== ["altitude", "battery", "gps", "nonce", "timestamp"].sort().join(",")) return reject("Phase 1 telemetry fields only", 400);
  if (!body.gps || typeof body.gps !== "object" || Object.keys(body.gps).sort().join(",") !== "latitude,longitude") return reject("invalid GPS", 400);
  if (!validNumber(body.gps.latitude) || body.gps.latitude < -90 || body.gps.latitude > 90 || !validNumber(body.gps.longitude) || body.gps.longitude < -180 || body.gps.longitude > 180) return reject("invalid GPS", 400);
  if (!validNumber(body.altitude) || !validNumber(body.battery) || body.battery < 0 || body.battery > 100) return reject("invalid telemetry", 400);
  if (typeof body.nonce !== "string" || body.nonce.length < 16 || body.nonce.length > 128) return reject("invalid nonce", 400);

  const sentAt = Date.parse(body.timestamp);
  const now = Date.now();
  if (!Number.isFinite(sentAt) || Math.abs(now - sentAt) > MAX_AGE_MS) return reject("timestamp outside 30-second window", 401);

  cleanupNonces(now);
  if (nonceCache.has(body.nonce)) return reject("replay detected", 409);

  const supplied = req.headers.get("x-hvf-signature") || "";
  if (!/^[0-9a-f]{64}$/i.test(supplied)) return reject("missing or invalid signature", 401);
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(supplied.toLowerCase(), "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return reject("signature verification failed", 401);

  nonceCache.set(body.nonce, now + NONCE_TTL_MS);
  const hash = sha256hex(canonicalize(body));
  return NextResponse.json({
    verified: true,
    hash,
    nonce: body.nonce,
    timestamp: new Date().toISOString(),
    payloadVerification: "VALID",
    hashAlgorithm: "SHA-256"
  }, { status: 200, headers: { "cache-control": "no-store" } });
}
