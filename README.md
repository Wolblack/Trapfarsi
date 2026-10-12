# TRAPFARSI

**Music, with intention.** A responsive music-discovery interface with a glass/neumorphic visual system.

## Run locally

No build step or package manager is required.

```bash
python3 -m http.server 8080
```

Open http://localhost:8080. For installable/offline behavior, use HTTPS or localhost.

## Current features

- Discover, New Releases, Artists, Library, Search, Album Details, Now Playing, Profile, Community, and a hidden Lyrics Room.
- Import local audio files; play/pause, seek, volume, next/previous, queue, and mini-player. Local audio files are not uploaded.
- Personal playlists, profile and lyric notes in browser storage.
- Email magic-link account flow and cloud sync scaffold for profiles, playlists and notes through Supabase.
- Shared community-post database schema with row-level security, ready for integration.
- Installable web-app manifest and offline app shell.

## Enable accounts and cloud sync

1. Create a project at https://supabase.com.
2. Open **SQL Editor** and run the complete `supabase-schema.sql` file from this repository.
3. In **Project Settings → API**, copy the Project URL and the **publishable/anon public key**. Never use a `service_role` or secret key in frontend code.
4. Edit `supabase-config.js` and set `TRAPFARSI_SUPABASE_URL` and `TRAPFARSI_SUPABASE_ANON_KEY`.
5. In Supabase **Authentication → URL Configuration**, add your local URL (for example `http://localhost:8080`) and your deployed HTTPS site URL to the allowed redirect URLs. Configure your email provider.
6. Serve the project through localhost or HTTPS, then open Profile and request a sign-in link.

The client library is loaded from the Supabase CDN. If the CDN or network is blocked, local-only mode remains available.

## Important limitations

- Supabase setup is required for accounts and cloud sync. The frontend configuration is intentionally blank by default.
- The cloud layer syncs account data (profile, playlists, notes) to the signed-in account. The shared community table is created by the SQL schema; the current community UI still uses local preview posts and needs its final shared-feed wiring before public posting is live.
- This is not a licensed streaming catalogue. The player plays imported local audio and demo entries; it does not provide commercial music streams.
- Lyrics are user-entered notes/lyrics, not a copyrighted lyric-fetching service.
- Test the SQL and sign-in flow in your own Supabase project before public launch. No live Supabase credentials are included.

## Files

- `index.html` — application interface and player.
- `supabase-config.js` — public project URL/key placeholders.
- `cloud.js` — optional authentication and cloud sync layer.
- `supabase-schema.sql` — database tables and row-level security policies.
- `manifest.json`, `sw.js`, `icon.svg` — installable/offline app shell.
