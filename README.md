# TRAPFARSI

**Music, with intention.** A responsive music-discovery interface with a glass/neumorphic visual system.

## Run locally

The app itself is static and has no runtime dependency install. Node.js 22+ is needed only for the repository smoke tests.

```bash
python3 -m http.server 8080
```

Open http://localhost:8080. Installable/offline behavior requires HTTPS or localhost.

Run repository checks with:

```bash
npm test
npm run check
```

## Current implementation

- Discover, New Releases, Artists, Library, Search, Album Details, Now Playing, Profile, Community, and a hidden Lyrics Room.
- Import and play local audio files; play/pause, seek, volume, next/previous, queue, and mini-player. Local audio is never uploaded.
- Browser-local profile, playlists, and lyric notes.
- Optional Supabase email magic-link auth and private account-data sync.
- Shared community feed with authenticated publishing, editing, deletion, likes, saved posts, comments/replies, and report intake when Supabase is configured.
- SQL policies for private listener data, public community reading, owner-only mutations, follows, profile visibility, report intake, and a server-side post rate limit.
- Installable web-app manifest and offline app shell.

## Enable Supabase

1. Create a project at https://supabase.com.
2. In Supabase SQL Editor, run the complete `supabase-schema.sql` file.
3. In Project Settings → API, copy the Project URL and the publishable/anon public key. Never put a `service_role` or secret key in frontend code.
4. Add those public values to `supabase-config.js` as `TRAPFARSI_SUPABASE_URL` and `TRAPFARSI_SUPABASE_ANON_KEY`.
5. In Authentication → URL Configuration, allow your local origin (for example `http://localhost:8080`) and deployed HTTPS URL. Configure the email provider.
6. Run the app over localhost or HTTPS. Open Profile, request a sign-in link, and follow the email.
7. Test with two separate user accounts/devices to verify the same community posts appear for both.

## Account synchronization policy

- Cloud values take precedence when an account already has a saved key.
- Local profile/playlists/notes are uploaded only when that key does not yet exist in the cloud.
- This intentionally avoids overwriting existing cloud data with stale local state. It is not a field-level merge or conflict-resolution system.
- Sign-out preserves the browser's local copy.
- If cloud loading fails, the UI reports an error rather than claiming the shared feed succeeded.

## Honest limitations

- No Supabase project credentials are included, so live authentication, database policies, and cross-device sync have **not** been verified in this repository environment.
- Community interaction controls are now wired to Supabase tables for likes, saved posts, comments/replies, post editing/deletion, and reporting. A report is recorded for later review; there is no moderator dashboard or automatic moderation service yet. Listener profiles/follows have database policies, but a complete public profile/follow UI is still pending. Database changes must be applied to a configured Supabase project before these controls can work.
- Local-only mode uses browser storage; it is not a multi-device account.
- This is not a licensed streaming catalogue. Demo catalogue entries are not real streams; the player can play imported local audio.
- Lyrics and annotations are user-entered. No unauthorized lyrics fetching is provided.
- No automated browser tests or production deployment verification are claimed.

## Files

- `index.html` — application UI, local player, discovery, profile and local preview.
- `cloud.js` — optional auth, conservative account sync, shared community feed.
- `supabase-config.js` — public project URL/key placeholders.
- `supabase-schema.sql` — private account data, community posts/comments/likes/saves/reports, listener profiles/follows, RLS, indexes, and post limits.
- `manifest.json`, `sw.js`, `icon.svg` — installable/offline app shell.
