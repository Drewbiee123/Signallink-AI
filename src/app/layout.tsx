import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./style.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://verify.signallinkprotocol.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SignalLink Protocol LLC | Verifiable AI Evidence",
    template: "%s | SignalLink Protocol LLC"
  },
  description: "ADA-4WM provenance, SHA-256 anchoring, and durable verification evidence from SignalLink Protocol LLC.",
  applicationName: "SignalLink Verification Gateway",
  keywords: ["AI provenance", "ADA-4WM", "cryptographic verification", "SHA-256", "AI assurance", "SignalLink Protocol"],
  authors: [{ name: "SignalLink Protocol LLC" }],
  creator: "SignalLink Protocol LLC",
  publisher: "SignalLink Protocol LLC",
  robots: { index: true, follow: true }
};

export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
