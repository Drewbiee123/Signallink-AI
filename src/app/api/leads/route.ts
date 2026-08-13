import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const serviceCodes = new Set(["SL-PILOT", "SL-MONITORING", "SL-GOV-PO"]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const website = String(form.get("website") || "");
    if (website) return NextResponse.redirect(new URL("/services?submitted=1", request.url), 303);

    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim().toLowerCase();
    const organization = String(form.get("organization") || "").trim();
    const serviceCode = String(form.get("service_code") || "");
    const message = String(form.get("message") || "").trim();

    if (!name || name.length > 120 || !emailPattern.test(email) || !serviceCodes.has(serviceCode) || message.length > 5000) {
      return NextResponse.redirect(new URL("/services?error=invalid", request.url), 303);
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) throw new Error("Lead persistence is not configured");
    const { error } = await supabase.from("revenue_leads").insert({
      name,
      email,
      organization: organization || null,
      service_code: serviceCode,
      message: message || null,
      source: "website",
      metadata: { framework: "ADA-4WM", provenance_layer: 33 }
    });
    if (error) throw error;
    return NextResponse.redirect(new URL("/services?submitted=1", request.url), 303);
  } catch (error) {
    console.error("Lead intake failed", error);
    return NextResponse.redirect(new URL("/services?error=unavailable", request.url), 303);
  }
}
