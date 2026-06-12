-- ============================================================
-- Aike Desktop App — M2: workspace (CRM, fatture, documenti,
-- automazioni, knowledge base, template, memoria, connessioni MCP/CLI)
--
-- Tabelle owner-only: ogni riga appartiene a un singolo utente
-- (user_id = auth.users.id). RLS attiva con policy CRUD owner-only
-- per il ruolo authenticated (user_id = auth.uid()).
--
-- Le Cloudflare Functions usano la service key (bypassa RLS) ma
-- filtrano sempre per user_id ricavato dal JWT.
--
-- Idempotente: create table if not exists + drop/create policy.
-- ============================================================

-- ------------------------------------------------------------
-- Helper: applica RLS + policy CRUD owner-only su una tabella.
-- Implementato inline per tabella (Postgres non ha "macro" SQL),
-- ma con blocchi DO idempotenti per le policy.
-- ------------------------------------------------------------

-- ============================================================
-- 1. clients (CRM)
-- ============================================================
create table if not exists public.clients (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  company    text,
  email      text,
  phone      text,
  notes      text,
  created_at timestamptz not null default now()
);
create index if not exists clients_user_created_idx
  on public.clients (user_id, created_at desc);
alter table public.clients enable row level security;

-- ============================================================
-- 2. invoices (fatture)
-- ============================================================
create table if not exists public.invoices (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  number     text,
  client     text,
  amount     numeric not null default 0,
  status     text not null default 'da_pagare'
             check (status in ('da_pagare', 'pagata', 'scaduta')),
  due_date   date,
  created_at timestamptz not null default now()
);
create index if not exists invoices_user_created_idx
  on public.invoices (user_id, created_at desc);
alter table public.invoices enable row level security;

-- ============================================================
-- 3. documents
-- ============================================================
create table if not exists public.documents (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text not null,
  category   text,
  note       text,
  created_at timestamptz not null default now()
);
create index if not exists documents_user_created_idx
  on public.documents (user_id, created_at desc);
alter table public.documents enable row level security;

-- ============================================================
-- 4. automations
-- ============================================================
create table if not exists public.automations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  trigger    text,
  enabled    boolean not null default true,
  last_run   text,
  created_at timestamptz not null default now()
);
create index if not exists automations_user_created_idx
  on public.automations (user_id, created_at desc);
alter table public.automations enable row level security;

-- ============================================================
-- 5. knowledge_entries (knowledge base)
-- ============================================================
create table if not exists public.knowledge_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text not null,
  content    text,
  created_at timestamptz not null default now()
);
create index if not exists knowledge_entries_user_created_idx
  on public.knowledge_entries (user_id, created_at desc);
alter table public.knowledge_entries enable row level security;

-- ============================================================
-- 6. templates
-- ============================================================
create table if not exists public.templates (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  kind       text,
  body       text,
  created_at timestamptz not null default now()
);
create index if not exists templates_user_created_idx
  on public.templates (user_id, created_at desc);
alter table public.templates enable row level security;

-- ============================================================
-- 7. memory_entries (memoria dell'agente)
-- ============================================================
create table if not exists public.memory_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  text       text not null,
  created_at timestamptz not null default now()
);
create index if not exists memory_entries_user_created_idx
  on public.memory_entries (user_id, created_at desc);
alter table public.memory_entries enable row level security;

-- ============================================================
-- 8. connections (Fase MCP/CLI: server MCP remoti/stdio, tool CLI)
-- ============================================================
create table if not exists public.connections (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  kind       text not null
             check (kind in ('mcp_remote', 'mcp_stdio', 'cli')),
  config     jsonb not null default '{}',
  enabled    boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists connections_user_created_idx
  on public.connections (user_id, created_at desc);
alter table public.connections enable row level security;

-- ============================================================
-- POLICY CRUD owner-only per il ruolo authenticated.
-- Pattern per ogni tabella: select / insert / update / delete
-- con predicato user_id = auth.uid().
-- Blocchi DO idempotenti: drop se esiste, poi create.
-- ============================================================
do $$
declare
  tbl text;
  tables text[] := array[
    'clients', 'invoices', 'documents', 'automations',
    'knowledge_entries', 'templates', 'memory_entries', 'connections'
  ];
begin
  foreach tbl in array tables loop
    -- SELECT
    execute format('drop policy if exists %I on public.%I',
                   tbl || '_select_own', tbl);
    execute format(
      'create policy %I on public.%I for select to authenticated using (user_id = auth.uid())',
      tbl || '_select_own', tbl);

    -- INSERT
    execute format('drop policy if exists %I on public.%I',
                   tbl || '_insert_own', tbl);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (user_id = auth.uid())',
      tbl || '_insert_own', tbl);

    -- UPDATE
    execute format('drop policy if exists %I on public.%I',
                   tbl || '_update_own', tbl);
    execute format(
      'create policy %I on public.%I for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())',
      tbl || '_update_own', tbl);

    -- DELETE
    execute format('drop policy if exists %I on public.%I',
                   tbl || '_delete_own', tbl);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (user_id = auth.uid())',
      tbl || '_delete_own', tbl);
  end loop;
end $$;
