create table if not exists athena_events (
 id uuid primary key default gen_random_uuid(),
 environment text not null check (environment in ('preview','production')),
 external_event_id text not null, bundle_id text not null,
 subscription_id text, subscription_topic text, resource_reference text,
 resource_type text, received_at timestamptz not null,
 signature_verified boolean not null, request_body_sha256 text not null,
 canonical_event_sha256 text not null, processing_status text not null,
 created_at timestamptz not null default now(),
 unique (environment, external_event_id)
);
create table if not exists athena_provenance_receipts (
 id uuid primary key default gen_random_uuid(),
 event_id uuid not null unique references athena_events(id),
 schema_version text not null, receipt_json jsonb not null,
 receipt_sha256 text not null, created_at timestamptz not null default now()
);
create table if not exists athena_subscriptions (
 id uuid primary key default gen_random_uuid(),
 athena_subscription_id text not null unique, topic_reference text,
 status text, environment text not null, callback_url text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists athena_anomalies (
 id uuid primary key default gen_random_uuid(),
 event_id uuid references athena_events(id),
 anomaly_type text not null, severity text not null,
 description text, detected_at timestamptz not null default now()
);
alter table athena_events enable row level security;
alter table athena_provenance_receipts enable row level security;
alter table athena_subscriptions enable row level security;
alter table athena_anomalies enable row level security;
