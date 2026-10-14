-- TRAPFARSI 2.0 product hardening.
-- Adds listener profile metadata and safe, aggregate-only community like counts.
-- Existing owner-only profile/data write policies remain in force.

alter table public.listener_profiles
  add column if not exists username text,
  add column if not exists location text,
  add column if not exists favorite_genres text[] not null default '{}';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.listener_profiles'::regclass
      and conname = 'listener_profiles_username_format_check'
  ) then
    alter table public.listener_profiles
      add constraint listener_profiles_username_format_check
      check (username is null or username ~ '^[a-z0-9_]{3,20}$');
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.listener_profiles'::regclass
      and conname = 'listener_profiles_location_length_check'
  ) then
    alter table public.listener_profiles
      add constraint listener_profiles_location_length_check
      check (location is null or char_length(location) <= 60);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.listener_profiles'::regclass
      and conname = 'listener_profiles_genres_count_check'
  ) then
    alter table public.listener_profiles
      add constraint listener_profiles_genres_count_check
      check (cardinality(favorite_genres) <= 12);
  end if;
end;
$$;

create unique index if not exists listener_profiles_username_lower_uidx
  on public.listener_profiles (lower(username))
  where username is not null;
create index if not exists listener_follows_followed_idx
  on public.listener_follows (followed_id, created_at desc);

-- Follow relationships are visible to their participants. Third parties can
-- read a relationship only when both profiles are public.
drop policy if exists "Listeners can read follow graph" on public.listener_follows;
drop policy if exists "Listeners can read permitted follow graph" on public.listener_follows;
create policy "Listeners can read permitted follow graph"
  on public.listener_follows
  for select to authenticated
  using (
    auth.uid() = follower_id
    or auth.uid() = followed_id
    or (
      exists (
        select 1 from public.listener_profiles AS follower_profile
        where follower_profile.user_id = listener_follows.follower_id
          and follower_profile.is_public = true
      )
      and exists (
        select 1 from public.listener_profiles AS followed_profile
        where followed_profile.user_id = listener_follows.followed_id
          and followed_profile.is_public = true
      )
    )
  );

-- Aggregate-only counts avoid exposing the identities of listeners who liked a post.
create or replace function public.community_post_like_counts(p_post_ids uuid[])
returns table (post_id uuid, like_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select likes.post_id, count(*)::bigint
  from public.community_post_likes as likes
  join public.community_posts as posts on posts.id = likes.post_id
  where coalesce(cardinality(p_post_ids), 0) between 1 and 100
    and likes.post_id = any(p_post_ids)
  group by likes.post_id;
$$;
revoke all on function public.community_post_like_counts(uuid[]) from public;
grant execute on function public.community_post_like_counts(uuid[]) to anon, authenticated;

-- Aggregate follower/following counts without exposing the underlying follow graph.
create or replace function public.listener_follow_counts(p_user_id uuid)
returns table (follower_count bigint, following_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select count(*)::bigint from public.listener_follows where followed_id = p_user_id),
    (select count(*)::bigint from public.listener_follows where follower_id = p_user_id)
  where exists (
    select 1 from public.listener_profiles
    where user_id = p_user_id and (is_public = true or user_id = auth.uid())
  );
$$;
revoke all on function public.listener_follow_counts(uuid) from public;
grant execute on function public.listener_follow_counts(uuid) to anon, authenticated;

comment on function public.community_post_like_counts(uuid[]) is
  'Returns like totals for up to 100 community post IDs without exposing liker identities.';
comment on function public.listener_follow_counts(uuid) is
  'Returns follow totals for public profiles or the authenticated profile owner only.';
