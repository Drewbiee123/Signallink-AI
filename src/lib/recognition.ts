import { getSupabaseAdmin } from "@/lib/supabase-admin";

export interface RecognitionRecord {
  anchor_id: string;
  timestamp: string;
  hash_algorithm: "SHA-256";
  hash: string;
  signature: string;
  signer: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export async function getLatestRecognition(): Promise<RecognitionRecord | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("anchors")
    .select("anchor_id,timestamp,hash_algorithm,hash,signature,signer,metadata,created_at")
    .contains("metadata", { certification: true })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Recognition lookup failed", error);
    return null;
  }
  return data as RecognitionRecord | null;
}
