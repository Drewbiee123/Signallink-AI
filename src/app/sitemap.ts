import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = process.env.NEXT_PUBLIC_APP_URL || "https://verify.signallinkprotocol.com";
  return [
    { url: origin, changeFrequency: "weekly", priority: 1 },
    { url: `${origin}/anchor`, changeFrequency: "weekly", priority: 1 },
    { url: `${origin}/verify`, changeFrequency: "weekly", priority: 1 },
    { url: `${origin}/services`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${origin}/recognition`, changeFrequency: "daily", priority: 0.9 },
    { url: `${origin}/.well-known/ai-provenance.json`, changeFrequency: "daily", priority: 0.8 }
  ];
}
