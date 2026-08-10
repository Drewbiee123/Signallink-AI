export interface AnchorRequest {
  payload: unknown;
}

export interface AnchorRecord {
  anchor_id: string;
  timestamp: string;
  hash_algorithm: "SHA-256";
  hash: string;
  signature: string;
  signer: string;
  metadata?: Record<string, unknown>;
}

export interface AnchorResponse {
  anchor_id: string;
  timestamp: string;
  hash_algorithm: "SHA-256";
  hash: string;
  status: "CREATED";
  signature: string;
}
