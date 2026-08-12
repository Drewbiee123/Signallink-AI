import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ status: "degraded", database: "not_configured" }, { status: 503 });
  const { error } = await supabase.from("anchors").select("anchor_id", { head: true, count: "exact" });
  return NextResponse.json({ status: error ? "degraded" : "ok", database: error ? "error" : "connected" }, { status: error ? 503 : 200 });
}
