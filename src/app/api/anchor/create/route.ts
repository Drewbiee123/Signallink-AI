import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { canonicalize } from "@/lib/canonicalize";
import { sha256hex } from "@/lib/hashing";
import { signString } from "@/lib/signing";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { AnchorRequest, AnchorRecord, AnchorResponse } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AnchorRequest;
    if (body?.payload === undefined) return NextResponse.json({ error: "payload is required" }, { status: 400 });
    const canonical = canonicalize(body.payload);
    const hash = sha256hex(canonical);
    const timestamp = new Date().toISOString();
    const signature = signString(`${hash}|${timestamp}`);
    const record: AnchorRecord = {
      anchor_id: `slk_${crypto.randomUUID()}`, timestamp, hash_algorithm: "SHA-256", hash, signature,
      signer: process.env.SIGNALINK_SIGNER || "SignalLink Protocol LLC / SignalLink AI",
      metadata: body.metadata || {}
    };
    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ error: "persistence is not configured" }, { status: 503 });
    const { error } = await supabase.from("anchors").insert(record);
    if (error) throw error;
    const response: AnchorResponse = { anchor_id: record.anchor_id, timestamp, hash_algorithm: "SHA-256", hash, signature, status: "CREATED" };
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Anchor create error", error);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
