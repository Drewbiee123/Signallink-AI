export const runtime = 'nodejs';

import crypto from 'crypto';
import { canonicalize } from '../../../../lib/canonicalize';
import { sha256hex } from '../../../../lib/hashing';
import { signString } from '../../../../lib/signing';
import { AnchorRequest, AnchorResponse, AnchorRecord } from '../../../../lib/types';
import { NextResponse } from 'next/server';

// In-memory store for scaffold purposes only
const STORE_KEY = '__signalink_anchor_store__';
function getStore(): Map<string, AnchorRecord> {
  const g = globalThis as any;
  if (!g[STORE_KEY]) g[STORE_KEY] = new Map();
  return g[STORE_KEY];
}

export async function POST(req: Request) {
  try {
    const body: AnchorRequest = await req.json();
    if (!body?.payload) {
      return NextResponse.json({ error: 'payload is required' }, { status: 400 });
    }

    // Step 1: Normalize payload and canonicalize
    const canonical = canonicalize(body.payload);

    // Step 2: Hash
    const hash = sha256hex(canonical);

    // Step 3: Timestamp
    const timestamp = new Date().toISOString();

    // Step 4: Signature (over hash + timestamp)
    const signingInput = `${hash}|${timestamp}`;
    const signature = signString(signingInput);

    // Step 5: Create anchor record
    const anchor_id = `slk_${(crypto.randomUUID && typeof crypto.randomUUID === 'function') ? crypto.randomUUID() : crypto.randomBytes(8).toString('hex')}`;
    const record: AnchorRecord = {
      anchor_id,
      timestamp,
      hash_algorithm: 'SHA-256',
      hash,
      signature,
      signer: process.env.SIGNALINK_SIGNER || 'signalink-prod',
      metadata: { note: 'scaffold record' },
    };

    // Persist to in-memory store (replace with DB for production)
    getStore().set(anchor_id, record);

    const response: AnchorResponse = {
      anchor_id,
      timestamp,
      hash_algorithm: 'SHA-256',
      hash,
      status: 'CREATED',
      signature,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (err: any) {
    console.error('Anchor create error:', err?.message || err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
