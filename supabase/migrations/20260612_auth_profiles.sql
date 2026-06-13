-- ============================================================
-- Aike — Auth unificata sito ↔ app (Subagent 1, 2026-06-12)
--
-- STATO LIVE VERIFICATO il 2026-06-12 (REST probe con anon key):
--   • public.users    ESISTE (id, email, plan, is_admin, created_at)
--       → è la tabella profilo realmente usata dal sito (auth.js getProfile).
--   • public.profiles NON ESISTE (PGRST205) — ma è referenziata da
--       bundle.js (preferenze, display_name) e functions/api/verify-email.js
--       (email_verified): oggi quelle chiamate falliscono in silenzio.
--
-- QUESTA MIGRATION (additiva, idempotente, NON distruttiva):
--   1. crea public.profiles con le colonne che sito e app già usano;
--   2. trigger on_auth_user_created → riga in users + profiles a ogni signup
--      (con exception handler: un errore nel trigger NON blocca mai il signup);
--   3. backfill additivo per gli utenti esistenti (ON CONFLICT DO NOTHING);
--   4. RLS owner-only su profiles + policy minime su users.
--
-- ROLLBACK (reversibile):
--   drop trigger if exists on_auth_user_created on auth.users;
--   drop function if exists public.handle_new_user();
--   drop table if exists public.profiles;        -- tabella nuova: nessun dato pre-esistente
--   -- il backfill su public.users è additivo: le righe aggiunte sono
--   -- individuabili con: select * from public.users where created_at >= '<data di apply>';
--
-- APPLICARE via Supabase SQL editor (serve ruolo postgres per il trigger
-- su auth.users). Nessuna service key nel repo.
-- ============================================================

-- ------------------------------------------------------------
-- 1. public.profiles — preferenze + stato verifica email.
--    Colonne = quelle lette/scritte da bundle.js e verify-email.js.
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id                  uuid primary key references auth.users (id) on delete cascade,
  email_verified      boolean     not null default false,
  display_name        text,
  locale              text        not null default 'it',
  email_notifications boolean     not null default true,
  ai_memory_enabled   boolean     not null default true,
  ai_suggestions      boolean     not null default true,
  plane_autosave      boolean     not null default true,
  plane_snap_grid     boolean     not null default false,
  plane_animations    boolean     not null default true,
  owl_language        text        not null default 'it',
  owl_tone            text        not null default 'balanced',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- updated_at automatico
create or replace function public.profiles_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.profiles_set_updated_at();

-- Policy owner-only (drop/create per idempotenza)
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- email_verified la scrive SOLO la service key (verify-email.js):
-- column-level revoke per i ruoli client.
revoke update (email_verified) on public.profiles from authenticated;
revoke update (email_verified) on public.profiles from anon;

-- ------------------------------------------------------------
-- 2. public.users — già esistente in produzione. Il blocco è solo
--    una rete di sicurezza per ambienti nuovi (IF NOT EXISTS: in
--    produzione non altera nulla).
-- ------------------------------------------------------------
create table if not exists public.users (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  plan       text    not null default 'free',
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users
  for select to authenticated using (id = auth.uid());

-- Insert self-service (fallback dell'app se il trigger non è ancora attivo).
-- Il check impedisce escalation: niente is_admin=true, niente plan diverso da free.
drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own" on public.users
  for insert to authenticated
  with check (
    id = auth.uid()
    and coalesce(is_admin, false) = false
    and coalesce(plan, 'free') = 'free'
  );

-- ------------------------------------------------------------
-- 3. Trigger: ogni nuovo utente auth.users → riga profilo in
--    public.users e public.profiles. SECURITY DEFINER (bypassa RLS),
--    exception handler: MAI bloccare un signup per un errore profilo.
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    insert into public.users (id, email, plan, is_admin)
    values (new.id, new.email, 'free', false)
    on conflict (id) do nothing;
  exception when others then
    raise warning 'handle_new_user (users): %', sqlerrm;
  end;
  begin
    insert into public.profiles (id, email_verified)
    values (new.id, new.email_confirmed_at is not null)
    on conflict (id) do nothing;
  exception when others then
    raise warning 'handle_new_user (profiles): %', sqlerrm;
  end;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 4. Backfill additivo per gli utenti già esistenti.
--    ON CONFLICT DO NOTHING: non tocca righe esistenti (plan, is_admin,
--    preferenze restano invariati). Rieseguibile senza effetti.
-- ------------------------------------------------------------
insert into public.users (id, email, plan, is_admin)
select u.id, u.email, 'free', false
from auth.users u
on conflict (id) do nothing;

insert into public.profiles (id, email_verified)
select u.id, (u.email_confirmed_at is not null)
from auth.users u
on conflict (id) do nothing;
