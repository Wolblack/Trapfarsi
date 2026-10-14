# TRAPFARSI 2.0 product hardening

This increment deliberately preserves the current interface and stylesheet design.

## Improvements

- Bounded community pagination (30 posts per request) with topic filtering applied in Supabase.
- Request-generation protection so stale feed responses do not replace a newer filter result.
- Like totals use an aggregate RPC instead of downloading other listeners' identity rows.
- Same-tab profile saves trigger a debounced update to `listener_profiles`; the public/private preference is preserved instead of forced public.
- Added username, optional location, favourite genres, optional avatar URL, and profile visibility controls inside the existing profile form.
- Private profile views hide profile details and follower/post metrics from other listeners.
- Follow-graph reads are limited to participants or relationships where both profiles are public.

## Required Supabase step

Apply `supabase/migrations/20261014_trapfarsi_community_profiles.sql` after the base `supabase-schema.sql`. The migration adds constrained profile fields, a case-insensitive unique username index, safer follow-graph read rules, and aggregate-only like/follow count functions. It is version-controlled and does not modify a hosted Supabase project until you run it.

## Validation

Run `npm test` and `npm run check`. Database-backed end-to-end testing still requires a Supabase project with the base schema and this migration applied.
