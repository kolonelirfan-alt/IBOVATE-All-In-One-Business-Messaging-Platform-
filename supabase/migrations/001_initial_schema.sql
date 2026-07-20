-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- Semua tabel di bawah ini menggunakan RLS policy:
-- workspace_id = (auth.jwt() ->> 'workspace_id')::uuid

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text default 'trial',
  created_at timestamptz default now()
);

create table if not exists users (
  id uuid primary key references auth.users(id),
  workspace_id uuid references workspaces(id),
  email text not null,
  role text default 'agent', -- owner | admin | agent
  created_at timestamptz default now()
);

create table if not exists channels (
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

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id),
  channel_id uuid references channels(id),
  external_id text not null, -- nomor WA atau IG user id
  name text,
  phone text,
  created_at timestamptz default now()
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id),
  contact_id uuid references contacts(id),
  status text default 'open', -- open | pending | resolved
  session_expires_at timestamptz, -- BATASAN TEKNIS META
  assigned_to uuid references users(id),
  last_message_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id),
  direction text not null, -- 'in' | 'out'
  source text not null, -- 'dashboard' | 'app_echo' | 'customer'
  content text,
  message_type text default 'text',
  media_url text, 
  media_expires_at timestamptz, 
  media_retained boolean default false, 
  meta_message_id text unique, -- untuk dedup/idempotency
  sent_at timestamptz not null, -- waktu ASLI pesan terjadi
  is_historical boolean default false,
  created_at timestamptz default now()
);

create table if not exists templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id),
  type text not null default 'quick_reply', -- 'quick_reply' | 'wa_official'
  name text not null,
  content text not null,
  category text, 
  approval_status text default 'draft',
  meta_template_id text,
  created_at timestamptz default now()
);

-- Row Level Security (RLS) Setup
alter table workspaces enable row level security;
alter table users enable row level security;
alter table channels enable row level security;
alter table contacts enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table templates enable row level security;

-- Setup basic RLS Policies (For Service Role & Auth Users)
-- In production, the RLS policies would ensure (auth.jwt() ->> 'workspace_id')::uuid = workspace_id
-- For now we can define a function to easily check workspace_id
create or replace function get_auth_workspace_id() returns uuid as $$
  select (auth.jwt() ->> 'workspace_id')::uuid;
$$ language sql stable;

create policy "Users can see own workspace data" on workspaces for all using (id = get_auth_workspace_id());
create policy "Users can see own workspace users" on users for all using (workspace_id = get_auth_workspace_id());
create policy "Users can see own workspace channels" on channels for all using (workspace_id = get_auth_workspace_id());
create policy "Users can see own workspace contacts" on contacts for all using (workspace_id = get_auth_workspace_id());
create policy "Users can see own workspace conversations" on conversations for all using (workspace_id = get_auth_workspace_id());
create policy "Users can see own workspace templates" on templates for all using (workspace_id = get_auth_workspace_id());

-- Messages need to join conversations to check workspace_id
create policy "Users can see messages in own workspace" on messages for all using (
  exists (
    select 1 from conversations 
    where conversations.id = messages.conversation_id 
    and conversations.workspace_id = get_auth_workspace_id()
  )
);
