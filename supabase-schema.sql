-- TRAPFARSI shared accounts + cloud sync
-- Run this entire file in Supabase Dashboard > SQL Editor.
create table if not exists public.listener_data (
  user_id uuid not null references auth.users(id) on delete cascade,
  data_key text not null check (data_key in ('profile','playlists','community_posts','lyrics_notes')),
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, data_key)
);

alter table public.listener_data enable row level security;

drop policy if exists "Listeners read own data" on public.listener_data;
create policy "Listeners read own data" on public.listener_data
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Listeners insert own data" on public.listener_data;
create policy "Listeners insert own data" on public.listener_data
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Listeners update own data" on public.listener_data;
create policy "Listeners update own data" on public.listener_data
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Listeners delete own data" on public.listener_data;
create policy "Listeners delete own data" on public.listener_data
  for delete to authenticated using (auth.uid() = user_id);

create index if not exists listener_data_updated_at_idx on public.listener_data (updated_at desc);

-- Community posts are shared separately so signed-in listeners can read the feed.
create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null check (char_length(author_name) between 1 and 32),
  category text not null check (category in ('US Rap','Persian Rap','R&B','Rock & Alternative','New Releases','Music Talk')),
  body text not null check (char_length(body) between 1 and 600),
  created_at timestamptz not null default now()
);
alter table public.community_posts enable row level security;
drop policy if exists "Anyone can read community posts" on public.community_posts;
create policy "Anyone can read community posts" on public.community_posts for select using (true);
drop policy if exists "Signed-in listeners can publish posts" on public.community_posts;
create policy "Signed-in listeners can publish posts" on public.community_posts for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Authors can delete their posts" on public.community_posts;
create policy "Authors can delete their posts" on public.community_posts for delete to authenticated using (auth.uid() = user_id);
