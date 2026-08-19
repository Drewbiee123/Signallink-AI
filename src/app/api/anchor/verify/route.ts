import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { canonicalize } from "@/lib/canonicalize";
import { sha256hex } from "@/lib/hashing";
import { verifyString } from "@/lib/signing";
import { readJsonBody, assertJsonComplexity } from "@/lib/input-guards";
import type { AnchorVerifyRequest, AnchorVerifyResponse } from "@/lib/types";

export const runtime = "nodejs";

function safeHexEqual(a: string, b: string): boolean {
  if (!/^[0-9a-f]{64}$/i.test(a) || !/^[0-9a-f]{64}$/i.test(b)) return false;
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function errorResponse(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "PAYLOAD_TOO_LARGE") return NextResponse.json({ error: "payload too large" }, { status: 413 });
    if (error.message === "INVALID_JSON") return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
    if (error.message === "PAYLOAD_TOO_COMPLEX" || error.message === "PAYLOAD_TOO_DEEP") {
      return NextResponse.json({ error: "payload complexity limit exceeded" }, { status: 400 });
    }
  }
  console.error("Anchor verify error", error);
  return NextResponse.json({ error: "internal error" }, { status: 500 });
}

export async function POST(req: Request) {
  try {
    const body = await readJsonBody<AnchorVerifyRequest>(req);
    if (!body || typeof body !== "object" || !("payload" in body)) {
      return NextResponse.json({ error: "payload is required" }, { status: 400 });
    }
    if (typeof body.timestamp !== "string" || !Number.isFinite(Date.parse(body.timestamp))) {
      return NextResponse.json({ error: "valid timestamp is required" }, { status: 400 });
    }
    if (typeof body.hash !== "string" || typeof body.signature !== "string") {
      return NextResponse.json({ error: "hash and signature are required" }, { status: 400 });
    }

    assertJsonComplexity(body.payload);
    const computedHash = sha256hex(canonicalize(body.payload));
    const hashValid = safeHexEqual(computedHash, body.hash);
    const signatureValid = hashValid && verifyString(`${body.hash}|${body.timestamp}`, body.signature);

    const response: AnchorVerifyResponse = {
      status: hashValid && signatureValid ? "VALID" : "INVALID",
      hash_algorithm: "SHA-256",
      computed_hash: computedHash,
      hash_valid: hashValid,
      signature_valid: signatureValid
    };

    return NextResponse.json(response, { status: response.status === "VALID" ? 200 : 422 });
  } catch (error) {
    return errorResponse(error);
  }
}
