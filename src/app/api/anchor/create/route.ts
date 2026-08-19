import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { canonicalize } from "@/lib/canonicalize";
import { sha256hex } from "@/lib/hashing";
import { signString } from "@/lib/signing";
import { readJsonBody, assertJsonComplexity } from "@/lib/input-guards";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { AnchorRequest, AnchorRecord, AnchorResponse } from "@/lib/types";

export const runtime = "nodejs";

function errorResponse(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "PAYLOAD_TOO_LARGE") return NextResponse.json({ error: "payload too large" }, { status: 413 });
    if (error.message === "INVALID_JSON") return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
    if (error.message === "PAYLOAD_TOO_COMPLEX" || error.message === "PAYLOAD_TOO_DEEP") {
      return NextResponse.json({ error: "payload complexity limit exceeded" }, { status: 400 });
    }
  }
  console.error("Anchor create error", error);
  return NextResponse.json({ error: "internal error" }, { status: 500 });
}

export async function POST(req: Request) {
  try {
    const body = await readJsonBody<AnchorRequest>(req);
    if (!body || typeof body !== "object" || !("payload" in body)) {
      return NextResponse.json({ error: "payload is required" }, { status: 400 });
    }

    assertJsonComplexity(body.payload);
    const canonical = canonicalize(body.payload);
    const hash = sha256hex(canonical);
    const timestamp = new Date().toISOString();
    const signature = signString(`${hash}|${timestamp}`);
    const record: AnchorRecord = {
      anchor_id: `slk_${crypto.randomUUID()}`,
      timestamp,
      hash_algorithm: "SHA-256",
      hash,
      signature,
      signer: process.env.SIGNALINK_SIGNER || "SignalLink Protocol LLC / SignalLink AI",
      metadata: body.metadata || {}
    };

    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ error: "persistence is not configured" }, { status: 503 });

    const { error } = await supabase.from("anchors").insert(record);
    if (error) throw error;

    const response: AnchorResponse = {
      anchor_id: record.anchor_id,
      timestamp,
      hash_algorithm: "SHA-256",
      hash,
      signature,
      status: "CREATED"
    };
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
