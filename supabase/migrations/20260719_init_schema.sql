-- Semua tabel di bawah ini menggunakan RLS policy:
-- workspace_id = (auth.jwt() ->> 'workspace_id')::uuid

create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text default 'trial',
  created_at timestamptz default now()
);

create table users (
  id uuid primary key references auth.users(id),
  workspace_id uuid references workspaces(id),
  email text not null,
  role text default 'agent', -- owner | admin | agent
  created_at timestamptz default now()
);

create table channels (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id),
  type text not null, -- 'whatsapp' | 'instagram'
  external_account_id text not null, -- waba_id atau ig_account_id
  coexistence_enabled boolean default false,
  status text default 'pending', -- pending | active | disconnected
  historical_sync_status text default 'not_started', -- not_started | syncing | completed | failed
  historical_sync_started_at timestamptz,
  historical_sync_completed_at timestamptz,
  created_at timestamptz default now()
);

create table contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id),
  channel_id uuid references channels(id),
  external_id text not null, -- nomor WA atau IG user id
  name text,
  created_at timestamptz default now()
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id),
  contact_id uuid references contacts(id),
  status text default 'open', -- open | pending | resolved (KEPUTUSAN MANUAL AGENT)
  session_expires_at timestamptz, -- BATASAN TEKNIS META
  assigned_to uuid references users(id),
  last_message_at timestamptz,
  created_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id),
  direction text not null, -- 'in' | 'out'
  source text not null, -- 'dashboard' | 'app_echo' | 'customer'
  content text,
  message_type text default 'text',
  media_url text, -- URL di Supabase Storage
  media_expires_at timestamptz, -- default now() + interval '1 day', null jika tidak ada media
  media_retained boolean default false, -- true = agent pilih simpan permanen
  meta_message_id text unique, -- untuk dedup/idempotency
  sent_at timestamptz not null, -- waktu ASLI pesan terjadi (dari payload Meta)
  is_historical boolean default false, -- true jika berasal dari backfill Coexistence
  created_at timestamptz default now() -- waktu baris ini disimpan ke DB
);

create table templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id),
  type text not null default 'quick_reply', -- 'quick_reply' | 'wa_official'
  name text not null,
  content text not null,
  category text, -- untuk wa_official: marketing | utility | authentication
  approval_status text default 'draft', -- draft | pending | approved | rejected
  meta_template_id text, -- ID template dari Meta setelah disetujui, null untuk quick_reply
  created_at timestamptz default now()
);

-- Enable RLS for all tables
alter table workspaces enable row level security;
alter table users enable row level security;
alter table channels enable row level security;
alter table contacts enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table templates enable row level security;

-- Create RLS Policies

create policy "Users can access their own workspace" on workspaces
  for all using (id = (auth.jwt() ->> 'workspace_id')::uuid);

create policy "Users can access users in their workspace" on users
  for all using (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid);

create policy "Users can access channels in their workspace" on channels
  for all using (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid);

create policy "Users can access contacts in their workspace" on contacts
  for all using (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid);

create policy "Users can access conversations in their workspace" on conversations
  for all using (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid);

create policy "Users can access messages via conversation" on messages
  for all using (conversation_id in (
    select id from conversations where workspace_id = (auth.jwt() ->> 'workspace_id')::uuid
  ));

create policy "Users can access templates in their workspace" on templates
  for all using (workspace_id = (auth.jwt() ->> 'workspace_id')::uuid);
