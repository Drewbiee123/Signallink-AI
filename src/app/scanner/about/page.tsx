import Link from "next/link";

export default function ScannerAbout() {
  return <main>
    <p className="eyebrow">SIGNALLINK SCANNER DETAILS</p>
    <h1>Know what each scan means.</h1>
    <div className="evidence">
      <div><h2>What you receive</h2><p>A SHA-256 fingerprint of the exact submitted file, a C2PA manifest validation result when supported, a UTC scan time, and a signed JSON receipt. The offline verifier checks the original file, receipt, and matching public key.</p></div>
      <div><h2>What it cannot decide</h2><p>A missing credential is not proof of human origin. A valid credential does not prove the picture or recording is factually true. SynthID and statistical AI-origin detection are not included in the current scan.</p></div>
      <div><h2>Free and paid access</h2><p>Three free scans may be claimed per network connection. A $4.99 purchase adds ten scans with no scheduled expiry. The $9.99 monthly subscription has no monthly scan cap; a limit of 15 scans per minute protects the service. It renews monthly until canceled. Cancel renewal from the scanner page with your access key; access continues to the end of the paid period.</p></div>
      <div><h2>Files and account data</h2><p>The scanner processes the uploaded file in memory and does not save its bytes. The anchor ledger stores the file hash, receipt hash, media type, signature, and scan time. The downloaded receipt contains the original filename. Free access stores a protected digest of the network address to enforce the free limit. Stripe processes payments; the order record stores the receipt email and transaction identifiers. Your browser saves the bearer access key, while the server stores its hash.</p></div>
      <div><h2>Support and refunds</h2><p>Keep your access key and Stripe receipt. If the key is lost, a scan fails, or you want to request a refund, send a support request with the receipt email. A person reviews recovery and refund requests. No legal, forensic, or identity determination is promised by an automated scan.</p></div>
    </div>
    <p className="actions action-row"><Link href="/scanner">Open scanner</Link><Link href="/scanner/support">Contact support</Link></p>
  </main>;
}
