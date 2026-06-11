-- ============================================================
-- Aike Desktop App — M1: tracking utilizzo (finestre rolling 5h)
-- Tabella scritta/letta SOLO dalle Cloudflare Functions con
-- service key. RLS attiva senza policy pubbliche = nessun
-- accesso da anon/authenticated.
-- Forward-compatible con M2/M3: workspace_id e credits già qui.
-- ============================================================

create table if not exists public.usage_events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  workspace_id uuid,                       -- M2: riferimento workspaces
  model        text not null default 'groq',
  credits      integer not null default 0, -- M3: crediti pesati per modello
  kind         text not null default 'chat',
  created_at   timestamptz not null default now()
);

create index if not exists usage_events_user_created_idx
  on public.usage_events (user_id, created_at desc);

create index if not exists usage_events_kind_idx
  on public.usage_events (kind);

alter table public.usage_events enable row level security;

-- Nessuna policy: accesso esclusivo via service role (Functions).
-- M2 aggiungerà una policy di sola lettura per i membri del workspace
-- (per mostrare lo storico utilizzo nella dashboard).
