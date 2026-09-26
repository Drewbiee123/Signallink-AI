import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SignalLink Media Evidence",
    short_name: "SignalLink",
    description: "Create downloadable SHA-256 media receipts and verify evidence.",
    start_url: "/scanner",
    display: "standalone",
    background_color: "#07110f",
    theme_color: "#07110f",
    icons: [{ src: "/app-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }]
  };
}
