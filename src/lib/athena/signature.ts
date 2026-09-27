// The verifier is deliberately fail-closed. Configure this adapter only after
// confirming athenahealth's signed-byte format, headers and key rotation rules.
export function signatureReady(): boolean { return false; }
export async function verifyAthenaSignature(_body: Uint8Array, _headers: Headers): Promise<boolean> {
  return false;
}
