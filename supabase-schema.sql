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


-- Community interaction layer: comments/replies, likes, saved posts, and follows.
-- Every mutation is tied to auth.uid(); public reads expose only community content.
create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.community_comments(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.community_comments enable row level security;
drop policy if exists "Public can read comments" on public.community_comments;
create policy "Public can read comments" on public.community_comments for select to anon, authenticated using (true);
drop policy if exists "Listeners can comment" on public.community_comments;
create policy "Listeners can comment" on public.community_comments for insert to authenticated
  with check (auth.uid() = user_id and char_length(btrim(body)) between 1 and 1000);
drop policy if exists "Authors can edit comments" on public.community_comments;
create policy "Authors can edit comments" on public.community_comments for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id and char_length(btrim(body)) between 1 and 1000);
drop policy if exists "Authors can delete comments" on public.community_comments;
create policy "Authors can delete comments" on public.community_comments for delete to authenticated using (auth.uid() = user_id);
create index if not exists community_comments_post_created_idx on public.community_comments(post_id, created_at);

create table if not exists public.community_post_likes (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.community_post_likes enable row level security;
drop policy if exists "Public can read post like counts" on public.community_post_likes;
create policy "Public can read post like counts" on public.community_post_likes for select to anon, authenticated using (true);
drop policy if exists "Listeners can like posts" on public.community_post_likes;
create policy "Listeners can like posts" on public.community_post_likes for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Listeners can unlike own likes" on public.community_post_likes;
create policy "Listeners can unlike own likes" on public.community_post_likes for delete to authenticated using (auth.uid() = user_id);

create table if not exists public.saved_community_posts (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.saved_community_posts enable row level security;
drop policy if exists "Listeners read own saved posts" on public.saved_community_posts;
create policy "Listeners read own saved posts" on public.saved_community_posts for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Listeners save posts" on public.saved_community_posts;
create policy "Listeners save posts" on public.saved_community_posts for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Listeners unsave posts" on public.saved_community_posts;
create policy "Listeners unsave posts" on public.saved_community_posts for delete to authenticated using (auth.uid() = user_id);

create table if not exists public.listener_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followed_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);
alter table public.listener_follows enable row level security;
drop policy if exists "Listeners can read follow graph" on public.listener_follows;
create policy "Listeners can read follow graph" on public.listener_follows for select to authenticated using (true);
drop policy if exists "Listeners can follow" on public.listener_follows;
create policy "Listeners can follow" on public.listener_follows for insert to authenticated with check (auth.uid() = follower_id and follower_id <> followed_id);
drop policy if exists "Listeners can unfollow" on public.listener_follows;
create policy "Listeners can unfollow" on public.listener_follows for delete to authenticated using (auth.uid() = follower_id);

create table if not exists public.listener_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Listener' check (char_length(btrim(display_name)) between 1 and 32),
  avatar_url text,
  bio text not null default '' check (char_length(bio) <= 240),
  is_public boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.listener_profiles enable row level security;
drop policy if exists "Public profiles are visible to everyone" on public.listener_profiles;
create policy "Public profiles are visible to everyone" on public.listener_profiles for select to anon, authenticated using (is_public or auth.uid() = user_id);
drop policy if exists "Listeners create own profile" on public.listener_profiles;
create policy "Listeners create own profile" on public.listener_profiles for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Listeners update own profile" on public.listener_profiles;
create policy "Listeners update own profile" on public.listener_profiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id and char_length(btrim(display_name)) between 1 and 32 and char_length(bio) <= 240);
grant select on public.community_comments, public.community_post_likes to anon, authenticated;
grant insert, update, delete on public.community_comments to authenticated;
grant insert, delete on public.community_post_likes to authenticated;
grant select, insert, delete on public.saved_community_posts to authenticated;
grant select, insert, delete on public.listener_follows to authenticated;
grant select, insert, update on public.listener_profiles to authenticated;
grant select on public.listener_profiles to anon;


-- Validate reply threading and apply a server-side comment rate limit.
create or replace function public.trapfarsi_validate_comment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare recent_count integer;
declare parent_post uuid;
begin
  if new.parent_id is not null then
    select post_id into parent_post from public.community_comments where id = new.parent_id;
    if parent_post is null or parent_post <> new.post_id then
      raise exception 'Reply must belong to the same post.' using errcode = '23514';
    end if;
  end if;
  select count(*) into recent_count
  from public.community_comments
  where user_id = new.user_id and created_at > now() - interval '10 minutes';
  if recent_count >= 20 then
    raise exception 'Comment limit reached. Please wait before commenting again.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
drop trigger if exists trapfarsi_validate_comment_before_write on public.community_comments;
create trigger trapfarsi_validate_comment_before_write
before insert on public.community_comments
for each row execute function public.trapfarsi_validate_comment();


-- Prevent clients from forging timestamps or transferring ownership to evade limits.
create or replace function public.trapfarsi_lock_post_metadata()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
    new.updated_at := now();
  else
    new.user_id := old.user_id;
    new.created_at := old.created_at;
    new.updated_at := now();
  end if;
  return new;
end;
$$;
drop trigger if exists trapfarsi_lock_post_metadata_before_write on public.community_posts;
create trigger trapfarsi_lock_post_metadata_before_write
before insert or update on public.community_posts
for each row execute function public.trapfarsi_lock_post_metadata();

create or replace function public.trapfarsi_lock_comment_metadata()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
    new.updated_at := now();
  else
    new.user_id := old.user_id;
    new.post_id := old.post_id;
    new.parent_id := old.parent_id;
    new.created_at := old.created_at;
    new.updated_at := now();
  end if;
  return new;
end;
$$;
drop trigger if exists trapfarsi_lock_comment_metadata_before_write on public.community_comments;
create trigger trapfarsi_lock_comment_metadata_before_write
before insert or update on public.community_comments
for each row execute function public.trapfarsi_lock_comment_metadata();


-- Like ownership is private: the client needs only its own like rows to toggle state.
drop policy if exists "Public can read post like counts" on public.community_post_likes;
drop policy if exists "Listeners read own likes" on public.community_post_likes;
create policy "Listeners read own likes" on public.community_post_likes
  for select to authenticated using (auth.uid() = user_id);


-- Server-owned revision timestamps make optimistic sync checks meaningful.
create or replace function public.trapfarsi_touch_listener_data()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists trapfarsi_touch_listener_data_before_write on public.listener_data;
create trigger trapfarsi_touch_listener_data_before_write
before insert or update on public.listener_data
for each row execute function public.trapfarsi_touch_listener_data();

-- Server-side rate limiting for the public-facing lyrics-search Edge Function.
-- Only hashed request fingerprints are stored; raw IP addresses are never written.
create table if not exists public.trapfarsi_api_rate_limits (
  fingerprint text primary key check (char_length(fingerprint) between 32 and 64),
  window_started_at timestamptz not null default clock_timestamp(),
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default clock_timestamp()
);
create index if not exists trapfarsi_api_rate_limits_updated_at_idx
  on public.trapfarsi_api_rate_limits (updated_at);
alter table public.trapfarsi_api_rate_limits enable row level security;
revoke all on public.trapfarsi_api_rate_limits from anon, authenticated;
grant all on public.trapfarsi_api_rate_limits to service_role;

create or replace function public.trapfarsi_check_and_increment_rate_limit(
  p_fingerprint text,
  p_window_seconds integer default 60,
  p_limit integer default 12
)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_window_started timestamptz;
  v_count integer;
  v_window_seconds integer := greatest(1, least(coalesce(p_window_seconds, 60), 3600));
  v_limit integer := greatest(1, least(coalesce(p_limit, 12), 1000));
begin
  if p_fingerprint is null or char_length(p_fingerprint) < 32 or char_length(p_fingerprint) > 64 then
    return query select false, 60;
    return;
  end if;

  insert into public.trapfarsi_api_rate_limits as r (fingerprint, window_started_at, request_count, updated_at)
  values (p_fingerprint, v_now, 1, v_now)
  on conflict (fingerprint) do update set
    window_started_at = case
      when r.window_started_at <= v_now - make_interval(secs => v_window_seconds) then v_now
      else r.window_started_at
    end,
    request_count = case
      when r.window_started_at <= v_now - make_interval(secs => v_window_seconds) then 1
      else r.request_count + 1
    end,
    updated_at = v_now
  returning r.window_started_at, r.request_count into v_window_started, v_count;

  -- Opportunistic cleanup: old hashes have no use after a day.
  if random() < 0.03 then
    delete from public.trapfarsi_api_rate_limits where updated_at < v_now - interval '24 hours';
  end if;

  return query select
    v_count <= v_limit,
    greatest(0, ceil(extract(epoch from (v_window_started + make_interval(secs => v_window_seconds) - v_now)))::integer);
end;
$$;
revoke all on function public.trapfarsi_check_and_increment_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.trapfarsi_check_and_increment_rate_limit(text, integer, integer) to service_role;
