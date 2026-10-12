-- TRAPFARSI database schema (safe to re-run).
-- Run in Supabase Dashboard > SQL Editor.
-- Frontend must use only the project's publishable/anon key, never service_role.

create table if not exists public.listener_data (
  user_id uuid not null references auth.users(id) on delete cascade,
  data_key text not null check (data_key in ('profile','playlists','community_posts','lyrics_notes')),
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, data_key)
);
alter table public.listener_data enable row level security;
drop policy if exists "Listeners read own data" on public.listener_data;
create policy "Listeners read own data" on public.listener_data for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Listeners insert own data" on public.listener_data;
create policy "Listeners insert own data" on public.listener_data for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Listeners update own data" on public.listener_data;
create policy "Listeners update own data" on public.listener_data for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Listeners delete own data" on public.listener_data;
create policy "Listeners delete own data" on public.listener_data for delete to authenticated using (auth.uid() = user_id);
create index if not exists listener_data_updated_at_idx on public.listener_data (updated_at desc);

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null check (char_length(btrim(author_name)) between 1 and 32),
  category text not null check (category in ('US Rap','Persian Rap','R&B','Rock & Alternative','New Releases','Music Talk')),
  body text not null check (char_length(btrim(body)) between 1 and 600),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.community_posts add column if not exists updated_at timestamptz not null default now();
alter table public.community_posts enable row level security;
drop policy if exists "Anyone can read community posts" on public.community_posts;
create policy "Anyone can read community posts" on public.community_posts for select to anon, authenticated using (true);
drop policy if exists "Signed-in listeners can publish posts" on public.community_posts;
create policy "Signed-in listeners can publish posts" on public.community_posts for insert to authenticated with check (auth.uid() = user_id and char_length(btrim(body)) between 1 and 600 and char_length(btrim(author_name)) between 1 and 32);
drop policy if exists "Authors can delete their posts" on public.community_posts;
create policy "Authors can delete their posts" on public.community_posts for delete to authenticated using (auth.uid() = user_id);
drop policy if exists "Authors can edit their posts" on public.community_posts;
create policy "Authors can edit their posts" on public.community_posts for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id and char_length(btrim(body)) between 1 and 600 and char_length(btrim(author_name)) between 1 and 32);

create index if not exists community_posts_created_at_idx on public.community_posts (created_at desc);
create index if not exists community_posts_category_created_at_idx on public.community_posts (category, created_at desc);

-- Server-side posting limit: maximum five posts per user in a rolling ten-minute window.
create or replace function public.trapfarsi_limit_community_posts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare recent_count integer;
begin
  select count(*) into recent_count
  from public.community_posts
  where user_id = new.user_id
    and created_at > now() - interval '10 minutes';
  if recent_count >= 5 then
    raise exception 'Posting limit reached. Please wait a few minutes before posting again.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;
drop trigger if exists trapfarsi_community_post_rate_limit on public.community_posts;
create trigger trapfarsi_community_post_rate_limit
before insert on public.community_posts
for each row execute function public.trapfarsi_limit_community_posts();

-- Minimal report intake. Only the reporter can read their reports; moderation
-- operations require a trusted server/admin workflow and are not exposed to clients.
create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.community_posts(id) on delete cascade,
  reason text not null check (char_length(btrim(reason)) between 3 and 240),
  created_at timestamptz not null default now(),
  unique (reporter_id, post_id)
);
alter table public.community_reports enable row level security;
drop policy if exists "Listeners can submit reports" on public.community_reports;
create policy "Listeners can submit reports" on public.community_reports for insert to authenticated
  with check (auth.uid() = reporter_id and char_length(btrim(reason)) between 3 and 240);
drop policy if exists "Listeners can read own reports" on public.community_reports;
create policy "Listeners can read own reports" on public.community_reports for select to authenticated
  using (auth.uid() = reporter_id);
revoke all on public.community_reports from anon, authenticated;
grant select, insert on public.community_reports to authenticated;
