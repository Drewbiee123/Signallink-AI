-- Scanner free claims and atomic, service-role-only metering.
create table if not exists public.scanner_free_claims (
  ip_digest text primary key,
  token_hash text not null unique,
  claimed_at timestamptz not null default now()
);
alter table public.scanner_free_claims enable row level security;
revoke all on public.scanner_free_claims from public, anon, authenticated;
grant select, insert on public.scanner_free_claims to service_role;

create or replace function public.claim_scanner_free(p_token_hash text, p_ip_digest text)
returns boolean language plpgsql security invoker set search_path = public as $$
begin
  if p_token_hash !~ '^[a-f0-9]{64}$' or p_ip_digest !~ '^[a-f0-9]{64}$' then
    return false;
  end if;
  insert into public.scanner_free_claims(ip_digest, token_hash)
  values (p_ip_digest, p_token_hash) on conflict do nothing;
  if not found then return false; end if;
  insert into public.service_entitlements(token_hash,service_code,status,max_uses,metadata)
  values(p_token_hash,'SL-SCAN-FREE3','active',3,jsonb_build_object('origin','SignalLink Protocol LLC'));
  return true;
end $$;
revoke all on function public.claim_scanner_free(text,text) from public, anon, authenticated;
grant execute on function public.claim_scanner_free(text,text) to service_role;

create or replace function public.record_scanner_scan(
  p_token_hash text, p_anchor_id text, p_timestamp timestamptz,
  p_hash text, p_signature text, p_signer text, p_metadata jsonb
)
returns table (remaining integer, entitlement_id uuid)
language plpgsql security invoker set search_path = public as $$
declare ent public.service_entitlements%rowtype;
begin
  select * into ent from public.service_entitlements
  where token_hash = p_token_hash for update;
  if not found or ent.status <> 'active' or (ent.expires_at is not null and ent.expires_at <= now())
     or (ent.max_uses is not null and ent.uses >= ent.max_uses)
     or ent.service_code not in ('SL-SCAN-FREE3','SL-SCAN-PACK10-499','SL-SCAN-MONTHLY-999') then
    raise exception 'SCANNER_ACCESS_DENIED';
  end if;
  if (select count(*) from public.validation_usage u where u.entitlement_id = ent.id and u.created_at > now() - interval '1 minute') >= 15 then
    raise exception 'SCANNER_RATE_LIMIT';
  end if;
  insert into public.anchors(anchor_id,timestamp,hash_algorithm,hash,signature,signer,metadata)
  values(p_anchor_id,p_timestamp,'SHA-256',p_hash,p_signature,p_signer,p_metadata);
  update public.service_entitlements set uses = uses + 1 where id = ent.id;
  insert into public.validation_usage(entitlement_id,service_code,metadata)
  values(ent.id,ent.service_code,jsonb_build_object('anchor_id',p_anchor_id));
  remaining := case when ent.max_uses is null then null else ent.max_uses - ent.uses - 1 end;
  entitlement_id := ent.id;
  return next;
end $$;
revoke all on function public.record_scanner_scan(text,text,timestamptz,text,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.record_scanner_scan(text,text,timestamptz,text,text,text,jsonb) to service_role;
