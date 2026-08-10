import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SignalLink AI | Provenance Console",
  description: "Evidence analysis, AI review, and cryptographic provenance receipts.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
