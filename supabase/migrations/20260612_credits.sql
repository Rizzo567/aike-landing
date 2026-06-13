-- ============================================================
-- Aike — Tabelle crediti & metering
--
-- Richieste da:
--   functions/api/credits.js     → public.user_credits (piano, pool crediti)
--   functions/api/chat.js        → public.user_credits (deduzione crediti)
--   functions/api/chat-agent.js  → public.user_credits (allowlist piano),
--                                  public.usage_events (rate-limit Free)
--
-- Non esisteva una migration nel repo (le tabelle erano create a mano).
-- Questo file le formalizza in modo IDEMPOTENTE: sicuro da rieseguire,
-- non distrugge dati esistenti (create table if not exists + drop/create policy).
--
-- Le scritture avvengono con la service role key (bypassa RLS). Le policy
-- qui sotto permettono all'utente autenticato di LEGGERE solo le proprie righe.
--
-- ROLLBACK (se mai servisse):
--   drop table if exists public.usage_events;
--   drop table if exists public.user_credits;
-- ============================================================

-- ------------------------------------------------------------
-- 1. user_credits — piano + pool crediti mensile per utente
-- ------------------------------------------------------------
create table if not exists public.user_credits (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  plan       text not null default 'free',          -- free | pro | max
  total      int  not null default 0,               -- crediti del ciclo
  used       int  not null default 0,
  reset_at   timestamptz not null default (now() + interval '30 days'),
  updated_at timestamptz default now(),
  unique (user_id)
);
alter table public.user_credits enable row level security;

drop policy if exists "user_credits_read_own" on public.user_credits;
create policy "user_credits_read_own"
  on public.user_credits for select
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 2. usage_events — un evento per richiesta (rate-limit anti-abuso)
-- ------------------------------------------------------------
create table if not exists public.usage_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  model      text,
  credits    int  not null default 0,               -- crediti pesati (haiku 1 / sonnet 3 / opus 8)
  kind       text not null default 'chat',
  created_at timestamptz not null default now()
);
create index if not exists usage_events_user_created_idx
  on public.usage_events (user_id, created_at desc);
alter table public.usage_events enable row level security;

drop policy if exists "usage_events_read_own" on public.usage_events;
create policy "usage_events_read_own"
  on public.usage_events for select
  using (auth.uid() = user_id);
