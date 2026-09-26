import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { canonicalize } from "@/lib/canonicalize";
import { sha256hex } from "@/lib/hashing";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { publicKeyPem, signString, verifyString } from "@/lib/signing";
import { scannerTokenHash, validScannerToken } from "@/lib/scanner-access";
import { retrieveSubscription } from "@/lib/stripe-api";

export const runtime = "nodejs";
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_BYTES + 64 * 1024;

async function limitedFormData(request: Request): Promise<FormData> {
  if (!request.body) throw new Error("EMPTY_BODY");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > MAX_REQUEST_BYTES) {
      await reader.cancel();
      throw new Error("PAYLOAD_TOO_LARGE");
    }
    chunks.push(value);
  }
  const body = Buffer.concat(chunks.map(chunk => Buffer.from(chunk)));
  return new Request("https://scanner.local", { method: "POST", headers: { "content-type": request.headers.get("content-type") || "" }, body }).formData();
}

function mediaKind(bytes: Buffer): "image" | "audio" | "video" | null {
  if (bytes.subarray(0, 3).toString("hex") === "ffd8ff" || bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" || bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP") return "image";
  if (bytes.subarray(0, 3).toString() === "ID3" || bytes.subarray(0, 4).toString() === "fLaC" || bytes.subarray(0, 4).toString() === "OggS" || bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WAVE") return "audio";
  if (bytes.subarray(4, 8).toString() === "ftyp" || bytes.subarray(0, 4).toString("hex") === "1a45dfa3") return "video";
  return null;
}

function mimeFromBytes(bytes: Buffer): string {
  const first = bytes.subarray(0, 12);
  if (first.subarray(0, 3).toString("hex") === "ffd8ff") return "image/jpeg";
  if (first.subarray(0, 8).toString("hex") === "89504e470d0a1a0a") return "image/png";
  if (first.subarray(0, 4).toString() === "RIFF") return first.subarray(8, 12).toString() === "WEBP" ? "image/webp" : "audio/wav";
  if (first.subarray(0, 3).toString() === "ID3") return "audio/mpeg";
  if (first.subarray(0, 4).toString() === "fLaC") return "audio/flac";
  if (first.subarray(0, 4).toString() === "OggS") return "audio/ogg";
  if (first.subarray(4, 8).toString() === "ftyp") return "video/mp4";
  if (first.subarray(0, 4).toString("hex") === "1a45dfa3") return "video/webm";
  return "application/octet-stream";
}

async function inspectC2pa(bytes: Buffer) {
  try {
    const { Reader, Context } = await import("@contentauth/c2pa-node");
    const reader = await Reader.fromAsset({ buffer: bytes, mimeType: mimeFromBytes(bytes) }, new Context({
      verify: { verifyAfterReading: true, verifyTrust: true, remoteManifestFetch: false, ocspFetch: false }
    }));
    if (!reader) return { status: "ABSENT", reason: "No embedded C2PA manifest found. This does not establish human origin." };
    const data = reader.json();
    const active = reader.getActive();
    const statuses = (data.validation_status || []).map(item => ({ code: item.code, explanation: item.explanation || null })).slice(0, 30);
    const untrusted = statuses.some(item => item.code?.includes("untrusted"));
    return {
      status: data.validation_state === "Trusted" ? "TRUSTED" : data.validation_state === "Valid" ? untrusted ? "VALID_UNTRUSTED" : "VALID_TRUST_UNCONFIRMED" : data.validation_state === "Invalid" ? "INVALID" : "UNDETERMINED",
      reason: "C2PA manifest parsed by the Content Authenticity Initiative SDK. Trust and integrity are reported separately by its validation state.",
      validation_state: data.validation_state || null,
      active_manifest: reader.activeLabel() || null,
      title: typeof active?.title === "string" ? active.title : null,
      validation_status: statuses
    };
  } catch (error) {
    return { status: "ERROR", reason: `C2PA validation could not complete: ${error instanceof Error ? error.name : "unknown error"}` };
  }
}

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!validScannerToken(token)) return NextResponse.json({ error: "A scanner access key is required" }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Scanner storage is unavailable" }, { status: 503 });
  const tokenHash = scannerTokenHash(token);
  const { data: access, error: accessError } = await supabase.from("service_entitlements")
    .select("service_code,status,metadata,uses,max_uses,expires_at")
    .eq("token_hash", tokenHash).maybeSingle();
  if (accessError) return NextResponse.json({ error: "Scanner access check failed" }, { status: 503 });
  if (!access || access.status !== "active" || access.expires_at && Date.parse(access.expires_at) <= Date.now() || access.max_uses !== null && access.uses >= access.max_uses) {
    return NextResponse.json({ error: "No active scans remain on this access key" }, { status: 402 });
  }
  if (access.service_code === "SL-SCAN-MONTHLY-999") {
    try {
      const subscriptionId = access.metadata?.subscription_id;
      if (typeof subscriptionId !== "string" || (await retrieveSubscription(subscriptionId)).status !== "active") {
        return NextResponse.json({ error: "Subscription is not active" }, { status: 402 });
      }
    } catch {
      return NextResponse.json({ error: "Subscription status is unavailable" }, { status: 503 });
    }
  }
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_REQUEST_BYTES) return NextResponse.json({ error: "File exceeds the 10 MB limit" }, { status: 413 });
  try {
    const form = await limitedFormData(request);
    const file = form.get("file");
    if (!(file instanceof File) || file.size < 1 || file.size > MAX_BYTES) return NextResponse.json({ error: "Choose a file up to 10 MB" }, { status: 400 });
    const bytes = Buffer.from(await file.arrayBuffer());
    const kind = mediaKind(bytes);
    if (!kind) return NextResponse.json({ error: "Unsupported file format" }, { status: 415 });
    const timestamp = new Date().toISOString();
    const c2pa = await inspectC2pa(bytes);
    const keyPem = publicKeyPem();
    if (!keyPem) return NextResponse.json({ error: "Public-key receipt signing is not configured" }, { status: 503 });
    const payload = {
      schema: "signallink.media-scan.v1",
      scanned_at: timestamp,
      nonce: crypto.randomUUID(),
      signing_key_sha256: crypto.createHash("sha256").update(keyPem).digest("hex"),
      file: { name: file.name.slice(0, 255), media_kind: kind, size_bytes: bytes.length, sha256: crypto.createHash("sha256").update(bytes).digest("hex") },
      findings: {
        integrity: "File SHA-256 fingerprint recorded",
        c2pa,
        synthid: { status: "NOT_CHECKED", reason: "An authorized watermark detector is not connected" },
        anomaly: { status: "NOT_CHECKED", reason: "No calibrated detection model is connected" }
      },
      conclusion: "ORIGIN_INCONCLUSIVE",
      explanation: "The receipt identifies the submitted bytes and reports C2PA evidence where present. It does not determine whether this media was created by a person or AI."
    };
    const hash = sha256hex(canonicalize(payload));
    let signature: string;
    try {
      signature = signString(`${hash}|${timestamp}`);
      if (signature.startsWith("hmac-sha256:")) return NextResponse.json({ error: "Public-key receipt signing is not configured" }, { status: 503 });
      if (!verifyString(`${hash}|${timestamp}`, signature)) return NextResponse.json({ error: "Receipt signing keys do not match" }, { status: 503 });
    } catch {
      return NextResponse.json({ error: "Receipt signing is unavailable" }, { status: 503 });
    }
    const anchorId = `slk_scan_${crypto.randomUUID()}`;
    const { data: charged, error } = await supabase.rpc("record_scanner_scan", {
      p_token_hash: tokenHash, p_anchor_id: anchorId, p_timestamp: timestamp, p_hash: hash, p_signature: signature,
      p_signer: process.env.SIGNALINK_SIGNER || "SignalLink Protocol LLC / SignalLink AI",
      p_metadata: { schema: payload.schema, media_kind: kind, file_sha256: payload.file.sha256, evidence_scope: "media_scan", payload_sha256: hash }
    });
    if (error?.message?.includes("SCANNER_ACCESS_DENIED")) return NextResponse.json({ error: "No active scans remain on this access key" }, { status: 402 });
    if (error?.message?.includes("SCANNER_RATE_LIMIT")) return NextResponse.json({ error: "Too many scans. Try again in one minute." }, { status: 429 });
    if (error) throw error;
    return NextResponse.json({ payload, timestamp, hash, signature, anchor_id: anchorId, verification: "/api/anchor/verify", signature_type: "PUBLIC_KEY", remaining: charged?.[0]?.remaining ?? null }, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") return NextResponse.json({ error: "File exceeds the 10 MB limit" }, { status: 413 });
    console.error("Media scan failed", error);
    return NextResponse.json({ error: "Scan failed. Please try again." }, { status: 500 });
  }
}
