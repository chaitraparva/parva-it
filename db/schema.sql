-- Parva IT website: lead management schema (PostgreSQL 14+ / Supabase Postgres)
-- Safe to run more than once.

create extension if not exists pgcrypto;

create table if not exists admins (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  name          text not null,
  password_hash text not null,
  role          text not null default 'executive' check (role in ('super_admin', 'manager', 'executive')),
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  last_login_at timestamptz
);

create table if not exists admin_sessions (
  token_hash  text primary key,
  admin_id    uuid not null references admins(id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  user_agent  text
);
create index if not exists admin_sessions_admin_idx on admin_sessions(admin_id);

create table if not exists password_resets (
  token_hash  text primary key,
  admin_id    uuid not null references admins(id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  used_at     timestamptz
);

create table if not exists login_attempts (
  id          bigserial primary key,
  email       text not null,
  ip_hash     text,
  success     boolean not null,
  created_at  timestamptz not null default now()
);
create index if not exists login_attempts_email_idx on login_attempts(email, created_at);

create sequence if not exists lead_code_seq start 1001;

create table if not exists leads (
  id                bigserial primary key,
  lead_code         text not null unique default ('PIT-' || nextval('lead_code_seq')),
  full_name         text not null,
  company           text,
  email             text not null,
  phone             text not null,
  industry          text,
  service           text not null,             -- "Type of requirement" / interested service
  project_interest  text,                      -- portfolio project the visitor came from, if any
  description       text not null,
  budget            text,
  source            text not null default 'Website contact form',
  is_demo_request   boolean not null default false,
  status            text not null default 'New' check (status in
                    ('New','Contacted','Interested','Meeting Scheduled','Proposal Sent','Negotiation','Converted','Lost')),
  assigned_to       uuid references admins(id) on delete set null,
  follow_up_date    date,
  idempotency_key   text unique,
  content_hash      text not null,
  ip_hash           text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists leads_created_idx on leads(created_at desc);
create index if not exists leads_status_idx on leads(status);
create index if not exists leads_followup_idx on leads(follow_up_date);
create index if not exists leads_dupe_idx on leads(content_hash, created_at);

create table if not exists lead_notes (
  id          bigserial primary key,
  lead_id     bigint not null references leads(id) on delete cascade,
  admin_id    uuid references admins(id) on delete set null,
  note        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists lead_notes_lead_idx on lead_notes(lead_id, created_at desc);

create table if not exists lead_history (
  id          bigserial primary key,
  lead_id     bigint not null references leads(id) on delete cascade,
  admin_id    uuid references admins(id) on delete set null,
  action      text not null,
  field       text,
  old_value   text,
  new_value   text,
  created_at  timestamptz not null default now()
);
create index if not exists lead_history_lead_idx on lead_history(lead_id, created_at desc);

create table if not exists settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);
insert into settings(key, value) values
  ('notifications', '{"enabled": false, "recipients": []}')
on conflict (key) do nothing;

-- This app talks to the database only from its own server functions using DATABASE_URL.
-- If you use Supabase, keep Row Level Security ON with no policies on these tables so the
-- public anon key can never read them.
alter table admins           enable row level security;
alter table admin_sessions   enable row level security;
alter table password_resets  enable row level security;
alter table login_attempts   enable row level security;
alter table leads            enable row level security;
alter table lead_notes       enable row level security;
alter table lead_history     enable row level security;
alter table settings         enable row level security;
