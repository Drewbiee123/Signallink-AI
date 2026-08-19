export interface AnchorRequest { payload: unknown; metadata?: Record<string, unknown> }
export interface AnchorRecord {
  anchor_id: string; timestamp: string; hash_algorithm: "SHA-256"; hash: string;
  signature: string; signer: string; metadata: Record<string, unknown>;
}
export interface AnchorResponse extends Omit<AnchorRecord, "signer" | "metadata"> { status: "CREATED" }

export interface AnchorVerifyRequest {
  payload: unknown;
  timestamp: string;
  hash: string;
  signature: string;
}

export interface AnchorVerifyResponse {
  status: "VALID" | "INVALID";
  hash_algorithm: "SHA-256";
  computed_hash: string;
  hash_valid: boolean;
  signature_valid: boolean;
}
