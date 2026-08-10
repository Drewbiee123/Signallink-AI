import crypto from 'crypto';

// Try to use SIGNALINK_PRIVATE_KEY (PEM/PKCS8) for signing; otherwise generate an Ed25519 keypair at startup (dev fallback).
let keyObject: crypto.KeyObject | null = null;
let publicKeyBase64: string | null = null;
if (process.env.SIGNALINK_PRIVATE_KEY && process.env.SIGNALINK_PRIVATE_KEY.trim().length > 0) {
  try {
    keyObject = crypto.createPrivateKey({ key: process.env.SIGNALINK_PRIVATE_KEY, format: 'pem' });
    // Derive public key
    const pub = crypto.createPublicKey(keyObject);
    publicKeyBase64 = pub.export({ type: 'spki', format: 'pem' }) as string;
    console.log('Using SIGNALINK_PRIVATE_KEY from environment for signing.');
  } catch (err) {
    console.warn('Failed to parse SIGNALINK_PRIVATE_KEY, falling back to generated keypair.', err instanceof Error ? err.message : err);
  }
}

if (!keyObject) {
  // Generate Ed25519 keypair for dev fallback
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  keyObject = privateKey;
  publicKeyBase64 = publicKey.export({ type: 'spki', format: 'pem' }) as string;
  keySource = 'generated';
  console.warn('No SIGNALINK_PRIVATE_KEY provided; using ephemeral generated Ed25519 key (dev only). Provide a private key in SIG... for production.');
}

export function getPublicKeyPem(): string | null {
  return publicKeyBase64;
}

export function signString(message: string): string {
  if (!keyObject) throw new Error('No signing key available');
  try {
    // For Ed25519 or compatible keys, use crypto.sign with null algorithm
    const sig = crypto.sign(null, Buffer.from(message, 'utf8'), keyObject);
    return sig.toString('base64');
  } catch (err) {
    // Fallback: HMAC using SIGNALINK_HMAC_KEY if present
    const hmacKey = process.env.SIGNALINK_HMAC_KEY;
    if (hmacKey && hmacKey.length > 0) {
      const hm = crypto.createHmac('sha256', hmacKey).update(message).digest('base64');
      return `hmac:${hm}`;
    }
    console.error('Signing failed and no HMAC key present:', err instanceof Error ? err.message : err);
    throw err;
  }
}
