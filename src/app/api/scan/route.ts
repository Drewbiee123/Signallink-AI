import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { canonicalize } from "@/lib/canonicalize";
import { sha256hex } from "@/lib/hashing";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { signString } from "@/lib/signing";

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

export async function POST(request: Request) {
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
    const payload = {
      schema: "signallink.media-scan.v1",
      scanned_at: timestamp,
      nonce: crypto.randomUUID(),
      file: { name: file.name.slice(0, 255), media_kind: kind, size_bytes: bytes.length, sha256: crypto.createHash("sha256").update(bytes).digest("hex") },
      findings: {
        integrity: "File SHA-256 fingerprint recorded",
        c2pa: { status: "NOT_CHECKED", reason: "C2PA validator is not connected" },
        synthid: { status: "NOT_CHECKED", reason: "An authorized watermark detector is not connected" },
        anomaly: { status: "NOT_CHECKED", reason: "No calibrated detection model is connected" }
      },
      conclusion: "ORIGIN_INCONCLUSIVE",
      explanation: "The receipt identifies the submitted bytes. It does not determine whether this media was created by a person or AI."
    };
    const hash = sha256hex(canonicalize(payload));
    let signature: string;
    try {
      signature = signString(`${hash}|${timestamp}`);
    } catch {
      return NextResponse.json({ error: "Receipt signing is unavailable" }, { status: 503 });
    }
    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ error: "Receipt storage is unavailable" }, { status: 503 });
    const anchorId = `slk_scan_${crypto.randomUUID()}`;
    const { error } = await supabase.from("anchors").insert({
      anchor_id: anchorId, timestamp, hash_algorithm: "SHA-256", hash, signature,
      signer: process.env.SIGNALINK_SIGNER || "SignalLink Protocol LLC / SignalLink AI",
      metadata: { schema: payload.schema, media_kind: kind, file_sha256: payload.file.sha256, evidence_scope: "media_scan", payload_sha256: hash }
    });
    if (error) throw error;
    return NextResponse.json({ payload, timestamp, hash, signature, anchor_id: anchorId, verification: "/api/anchor/verify", signature_type: signature.startsWith("hmac-sha256:") ? "SERVER_ONLY_HMAC" : "PUBLIC_KEY" }, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") return NextResponse.json({ error: "File exceeds the 10 MB limit" }, { status: 413 });
    console.error("Media scan failed", error);
    return NextResponse.json({ error: "Scan failed. Please try again." }, { status: 500 });
  }
}
