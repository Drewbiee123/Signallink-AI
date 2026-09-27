import { NextResponse } from "next/server";
import { isAthenaAdmin } from "@/lib/athena/admin";
import { athenaRequest } from "@/lib/athena/client";
export async function GET(req: Request) {
  if (!isAthenaAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const result = await athenaRequest("SubscriptionTopic") as { entry?: Array<{ resource?: Record<string, unknown> }> };
    return NextResponse.json({ topics: (result.entry || []).map(({ resource: r }) => ({
      id: r?.id, title: r?.title, status: r?.status, description: r?.description,
      resource_triggers: r?.resourceTrigger || []
    })) });
  } catch { return NextResponse.json({ error: "topic discovery unavailable" }, { status: 502 }); }
}
