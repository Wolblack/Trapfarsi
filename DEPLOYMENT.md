# Deployment guide

TRAPFARSI is a static HTML/CSS/JavaScript app with optional Supabase services. It can be hosted on Netlify or Vercel without a build step.

## 1. Run and verify locally

Use Node.js 22 or 24 for repository checks. From the project root:

```bash
npm test
npm run check
python3 -m http.server 8080
```

Open `http://localhost:8080`. Localhost is required for service-worker testing; opening `index.html` directly is not a reliable test environment.

## 2. Deploy to Netlify

1. Push the project to a Git repository.
2. Import that repository into Netlify.
3. Set the publish directory to `.` and leave the build command empty. `netlify.toml` contains the static publish setting and baseline security headers.
4. Deploy and test the resulting HTTPS site on desktop and mobile.

## 3. Deploy to Vercel

1. Import the repository into Vercel.
2. Choose the Other/static framework preset; no build command is required and the output directory is the repository root.
3. Deploy. `vercel.json` sets baseline security headers and avoids long caching for the HTML and service worker.

## 4. Optional Supabase

Follow the Supabase steps in `README.md`. Run the full schema in a non-production project first. Add only the project URL and public anon/publishable key to `supabase-config.js`. Never add server secrets to this static repository.

## 5. Optional lyric phrase search

Follow the licensed provider setup in `README.md`. Deploy the Edge Function with JWT verification enabled, configure `MUSIXMATCH_API_KEY` and the standard Supabase service environment, run the rate-limit SQL, then configure `TRAPFARSI_LYRICS_SEARCH_URL`. Test both normal and rate-limited requests. Do not enable the endpoint until provider access and usage rights are confirmed.

## 6. Release checks

- [ ] `npm test` and `npm run check` pass.
- [ ] No private keys or tokens are present in repository history or built files.
- [ ] RLS and authentication are tested with separate accounts.
- [ ] Keyboard navigation, reduced motion, mobile layout and screen-reader labels are reviewed.
- [ ] PWA install and offline shell are tested over HTTPS.
- [ ] Local audio import, persistent storage, backup restore and sleep timer are tested in current Safari, Chrome and Firefox.
- [ ] All demo metadata/artwork are replaced or clearly labeled; catalogue audio is properly licensed before advertising real streaming.
- [ ] A real privacy policy, contact route, community moderation process, and provider quotas are ready.
- [ ] Browser-based end-to-end tests are added before public launch.
