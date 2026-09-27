import { NextResponse } from "next/server";
import { isAthenaAdmin } from "@/lib/athena/admin";
import { athenaRequest } from "@/lib/athena/client";
type Context = { params: Promise<{ id: string }> };
async function handle(req: Request, ctx: Context, method: "GET" | "DELETE") {
  if (!isAthenaAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (method === "DELETE" && process.env.ATHENA_ENV === "production") return NextResponse.json({ error: "production disabled" }, { status: 403 });
  const { id } = await ctx.params;
  if (!/^[A-Za-z0-9._-]+$/.test(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  try { return NextResponse.json(await athenaRequest(`Subscription/${id}`, { method }) || { status: "deleted" }); }
  catch { return NextResponse.json({ error: "subscription request failed" }, { status: 502 }); }
}
export const GET = (req: Request, ctx: Context) => handle(req, ctx, "GET");
export const DELETE = (req: Request, ctx: Context) => handle(req, ctx, "DELETE");
