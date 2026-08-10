import { createHash, randomUUID } from "crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type Mode = "evidence" | "report" | "chat" | "code";

const instructions: Record<Mode, string> = {
  evidence:
    "Analyze the supplied evidence carefully. Separate direct observations, reasonable inferences, missing proof, contradictions, dates, entities, and recommended verification steps. Never invent facts.",
  report:
    "Create a professional SignalLink provenance report. Include executive summary, evidence inventory, findings, limitations, verification steps, and a clear conclusion. Do not overstate what the evidence proves.",
  chat:
    "Act as the SignalLink AI assistant. Give clear, practical answers using ordinary language while preserving technical accuracy.",
  code:
    "Review the supplied code. Identify concrete bugs and security problems, explain their impact, then provide corrected code. Do not claim to have executed code.",
};

function textFromResponse(data: any): string {
  if (typeof data?.output_text === "string") return data.output_text;
  const parts = Array.isArray(data?.output)
    ? data.output.flatMap((item: any) =>
        Array.isArray(item?.content)
          ? item.content.map((content: any) => content?.text).filter(Boolean)
          : []
      )
    : [];
  return parts.join("\n").trim();
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "XAI_API_KEY is not configured on the server." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const mode: Mode = ["evidence", "report", "chat", "code"].includes(body?.mode)
      ? body.mode
      : "chat";
    const input = typeof body?.input === "string" ? body.input.trim() : "";

    if (!input) {
      return NextResponse.json({ error: "Input is required." }, { status: 400 });
    }
    if (input.length > 100_000) {
      return NextResponse.json(
        { error: "Input is too large. Limit each request to 100,000 characters." },
        { status: 413 }
      );
    }

    const startedAt = new Date().toISOString();
    const model = process.env.XAI_MODEL || "grok-4.5";
    const upstream = await fetch("https://api.x.ai/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: `${instructions[mode]}\n\nUSER MATERIAL:\n${input}`,
      }),
      cache: "no-store",
    });

    const data = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      const message =
        data?.error?.message || data?.error || "The xAI request failed.";
      return NextResponse.json(
        { error: message, provider_status: upstream.status },
        { status: upstream.status }
      );
    }

    const output = textFromResponse(data);
    if (!output) {
      return NextResponse.json(
        { error: "xAI returned no readable text." },
        { status: 502 }
      );
    }

    const completedAt = new Date().toISOString();
    const canonicalRecord = JSON.stringify({
      mode,
      model,
      input_sha256: createHash("sha256").update(input).digest("hex"),
      output,
      started_at: startedAt,
      completed_at: completedAt,
      origin: "SignalLink Protocol LLC / SignalLink AI",
    });
    const receiptHash = createHash("sha256")
      .update(canonicalRecord)
      .digest("hex");

    return NextResponse.json({
      output,
      receipt: {
        receipt_id: `slk_${randomUUID()}`,
        timestamp: completedAt,
        mode,
        model,
        input_sha256: createHash("sha256").update(input).digest("hex"),
        record_sha256: receiptHash,
        origin: "SignalLink Protocol LLC / SignalLink AI",
        anchor_phrase: "Even your house was born on your foundation.",
      },
    });
  } catch (error) {
    console.error("SignalLink Grok route error", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
