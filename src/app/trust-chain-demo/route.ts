export const dynamic = "force-dynamic";

const SUPABASE_DEMO_URL =
  "https://ahwvgfmlvyhnxzlswnhb.supabase.co/functions/v1/trust-chain-demo";

export async function GET() {
  try {
    const upstream = await fetch(SUPABASE_DEMO_URL, {
      cache: "no-store",
      headers: {
        Accept: "text/html, text/plain;q=0.9, */*;q=0.8",
      },
    });

    const html = await upstream.text();

    if (!upstream.ok) {
      return new Response(
        `<!doctype html><html><body><h1>Prototype temporarily unavailable</h1><p>Upstream returned HTTP ${upstream.status}.</p></body></html>`,
        {
          status: 502,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
            "Referrer-Policy": "no-referrer",
          },
        },
      );
    }

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch {
    return new Response(
      "<!doctype html><html><body><h1>Prototype temporarily unavailable</h1><p>The upstream demo could not be reached.</p></body></html>",
      {
        status: 502,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
          "Referrer-Policy": "no-referrer",
        },
      },
    );
  }
}
