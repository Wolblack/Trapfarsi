# TRAPFARSI

**Music, with intention.** Premium glass/neumorphic music platform — multi-mode player, night theme, public discussion, lyrics stage, and EN/RU/FA languages.

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

- Discover, New Releases, Artists, Library, Search, Album Details, Now Playing, Profile, Community, and Lyrics Room.
- **Three player layouts** (toggle anytime): **Dock** bottom bar, **Mini** floating Apple Music–style pill, **Stage** full immersive glass player.
- Import and play local audio files; play/pause, seek, volume, next/previous, queue. Local audio is never uploaded.
- **Glass neumorphic lyrics stage**: line-by-line display that highlights with playback progress; write/paste your own lyrics or notes (no copyrighted lyric fetching).
- **Public discussion room**: community feed for open conversations (not private DMs) — channels for US Rap, Persian Rap, R&B, rock, new releases, and music talk.
- Browser-local profile, playlists, and lyric notes.
- Optional Supabase email magic-link auth and private account-data sync.
- Shared community feed with authenticated publishing, editing, deletion, likes, saved posts, comments/replies, and report intake when Supabase is configured.
- Public listener profiles (modal) with follow/unfollow, follower counts, and author links from community posts.
- SQL policies for private listener data, public community reading, owner-only mutations, follows, profile visibility, report intake, and a server-side post rate limit.
- Installable web-app manifest and offline app shell.
- **Phase 09 Profile & Icons**: rich profile hero, avatar marks, listening stats, achievement badges, specialized channel icon set (25 marks + brand logos).
- **Phase 10 Discovery Lab + Music DNA**: mood-based discovery over the available catalogue and a local activity snapshot using actual track starts, saved releases, and followed artists. It does not fabricate listener analytics or claim to be a streaming chart.
- **Phase 11 lyric-aware search**: search personal lyrics/notes stored in this browser and optionally search a licensed provider by a remembered lyric phrase. Provider API keys stay server-side; search returns track metadata and links, not full lyrics.
- **Three languages**: English, Русский, فارسی (RTL). Language switcher in the top bar; preference is saved.
- **Phase 08 Studio Max**: Night glass theme, shuffle/repeat, keyboard shortcuts, ambient art glow, stage queue, share-now-playing to discussion, mood discovery chips, lyric line seek.
- Repository smoke tests (`npm test`) covering files, schema, cloud profile/follow wiring, and app shell.

## Deployment and launch hardening

- `DEPLOYMENT.md` covers Netlify and Vercel setup, local verification, and the release checklist.
- `netlify.toml` and `vercel.json` set baseline browser security headers and avoid long caching for the HTML/service worker.
- `.github/workflows/quality.yml` runs the smoke tests and JavaScript syntax checks on Node.js 22 and 24 for pushes and pull requests.
- `PRIVACY.md` documents current local-first and optional-service data flows; it is a prototype notice, not legal advice or a final public privacy policy.
- `SECURITY.md` records secret-handling boundaries and minimum launch checks.
- The page includes social sharing metadata, a keyboard skip link, and global reduced-motion handling.

These are launch foundations, not proof of production readiness. Browser end-to-end testing, configured service checks, rights clearance, and a reviewed privacy policy are still required before a public release.

## Enable Supabase

1. Create a project at https://supabase.com.
2. In Supabase SQL Editor, run the complete `supabase-schema.sql` file.
3. In Project Settings → API, copy the Project URL and the publishable/anon public key. Never put a `service_role` or secret key in frontend code.
4. Add those public values to `supabase-config.js` as `TRAPFARSI_SUPABASE_URL` and `TRAPFARSI_SUPABASE_ANON_KEY`.
5. In Authentication → URL Configuration, allow your local origin (for example `http://localhost:8080`) and deployed HTTPS URL. Configure the email provider.
6. Run the app over localhost or HTTPS. Open Profile, request a sign-in link, and follow the email.
7. Test with two separate user accounts/devices to verify the same community posts appear for both.

## Enable lyric-phrase search (optional)

Local title/artist search and searching your own saved lyric notes work without any provider. To search a licensed external lyrics catalogue by a remembered phrase:

1. Review the provider terms and obtain your own Musixmatch developer/API access: https://developer.musixmatch.com/. Availability, quotas, permitted display and commercial use depend on your provider plan.
2. In Supabase SQL Editor, run the updated complete `supabase-schema.sql` (it includes a private rate-limit table and service-role-only RPC). Deploy `supabase/functions/lyrics-search/index.ts` as a Supabase Edge Function named `lyrics-search` with `supabase functions deploy lyrics-search` (install/configure the Supabase CLI first). Keep JWT verification enabled; do not deploy this provider-spending endpoint with `--no-verify-jwt`.
3. Set the provider key as a server-side Edge Function secret: `supabase secrets set MUSIXMATCH_API_KEY=YOUR_KEY`. Supabase Edge Functions also need their standard `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment values to reach the server-side rate-limit RPC. Never put the provider key or service-role key in `supabase-config.js`, HTML, or browser JavaScript.
4. Set `window.TRAPFARSI_LYRICS_SEARCH_URL` in `supabase-config.js` to `https://YOUR_PROJECT_REF.supabase.co/functions/v1/lyrics-search`. The frontend sends the public anon key only; the provider key remains on the server.
5. Run `npm test`, then test a distinctive phrase in Search → Lyrics. Confirm results link to the provider and that full lyrics are not returned by the proxy.

The proxy uses a database-backed limit of 12 requests per IP fingerprint per 60-second window and fails closed if the rate-limit store is unavailable. The limiter stores a keyed hash rather than a raw IP, but it is still a baseline—not complete protection against distributed abuse. Configure provider-appropriate quotas, monitor errors and costs, and confirm licensing/attribution obligations before public launch. If the provider or limiter is not configured, the interface falls back to local notes/catalogue search.

## Account synchronization policy

- Cloud values take precedence when an account already has a saved key.
- Local profile/playlists/notes are bootstrapped only when the cloud record is absent.
- Later writes use optimistic concurrency checks against the last cloud revision seen by the tab. If another device changes or removes that record first, the local write is blocked and a conflict is reported rather than silently overwriting the cloud value.
- This is record-level conflict detection, not a field-level merge UI. The local copy is retained on conflict and must be reviewed before retrying.
- Sign-out preserves the browser's local copy.
- If cloud loading fails, the UI reports an error rather than claiming the shared feed succeeded.

## Honest limitations

- No Supabase project credentials are included, so live authentication, database policies, and cross-device sync have **not** been verified in this repository environment.
- Community interaction controls are wired to Supabase tables for likes, saved posts, comments/replies, post editing/deletion, and reporting. A report is recorded for later review; there is no moderator dashboard or automatic moderation service yet.
- Public listener profiles and follow/unfollow are implemented: author names in the community feed open a profile modal with follower/following/post counts and a Follow control. Own profile rows are upserted into `listener_profiles` on sign-in. Database changes must be applied to a configured Supabase project before these controls can work.
- Local-only mode uses browser storage; it is not a multi-device account.
- This is not a licensed streaming catalogue. Demo catalogue entries are not real streams; the player can play imported local audio.
- Lyrics and annotations can be user-entered. Online phrase search is optional and requires a provider account/plan plus a deployed Edge Function; the proxy returns track metadata and links, not full lyrics. No unauthorized lyric scraping is implemented.
- No automated browser tests or production deployment verification are claimed.

## Files

- `index.html` — application UI, local player, discovery, profile and local preview.
- `studio.js` — three-mode player shell, glass lyrics stage, discussion polish.
- `phase08.js` — night theme, shuffle/repeat, shortcuts, ambient glow, share-to-room, stage queue.
- `i18n.js` — English / Russian / Persian (Farsi) UI + RTL.
- `phase09.js` — profile hub + avatar system.
- `phase10.js` — mood-based catalogue discovery and Music DNA snapshot from local activity.
- `phase11.js`, `phase11.css` — lyric-aware search UI, local note matching and optional server-side licensed-provider search.
- `supabase/functions/lyrics-search/index.ts` — optional Edge Function proxy; keeps the lyrics-provider API key server-side and returns metadata only.
- `icons/` — TrapFarsi channel icon set and brand logos.
- `cloud.js` — optional auth, conservative account sync, shared community feed, public profiles/follows.
- `supabase-config.js` — public project URL/key placeholders.
- `supabase-schema.sql` — private account data, community posts/comments/likes/saves/reports, listener profiles/follows, RLS, indexes, and post limits.
- `manifest.json`, `sw.js`, `icon.svg` — installable/offline app shell.

## Phase 12 — local-first reliability and controls

- **Persistent local audio is opt-in.** In Now Playing, enable “Remember imported audio in this browser” before choosing files. Selected files are stored in IndexedDB in this browser only; they are not uploaded. Browser/device storage can be cleared by the user or operating system, so keep original files elsewhere. Use the on-device audio library to play or remove stored copies, or forget all stored copies. Persistent audio is separate from JSON backups.
- **Sleep timer.** Pause local audio after 5–60 minutes or at the end of the current local track. The timer runs while the app is open; it is not a system-level alarm and is not guaranteed to fire if the browser or device is terminated.
- **Local data export/restore.** Profile → “Your data. Your decision.” exports or restores supported TRAPFARSI local data as JSON. Restore replaces the current local app-data snapshot and asks for confirmation. Export first before restoring. Audio blobs and Supabase authentication tokens are excluded. Server-side data is not exported by this local backup.
- **Honest playback analytics.** Demo catalogue entries provide editorial metadata only; they do not pretend to stream audio or contribute simulated listening time. Track starts are recorded only when an imported local audio source actually begins playing. On first run, a one-time migration resets unverifiable play/time totals from older builds. It preserves previous history entries but labels unverified demo activity so they do not count toward new play totals or the 20-track achievement.
- **Search polish.** The lyric filter is now registered only once; Persian/Arabic text normalization and optional licensed provider integration remain in Phase 11.

Persistent audio relies on browser IndexedDB. If the browser blocks it or storage is exhausted, temporary local playback remains available. IndexedDB persistence has not been browser-compatibility tested across every device/browser; verify it on the target phones and browsers before public launch.
