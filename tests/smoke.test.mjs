import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(name) {
  return readFileSync(join(root, name), "utf8");
}

test("required project files exist", () => {
  for (const file of [
    "index.html",
    "cloud.js",
    "studio.js",
    "phase08.js",
    "i18n.js",
    "phase09.js",
    "phase10.js",
    "phase11.js",
    "phase12.js",
    "phase12.css",
    "supabase-config.js",
    "supabase-schema.sql",
    "manifest.json",
    "sw.js",
    "icon.svg",
    "README.md",
    "package.json"
  ]) {
    assert.ok(existsSync(join(root, file)), `missing ${file}`);
  }
});

test("studio player modes and lyrics stage are present", () => {
  const src = read("studio.js");
  assert.match(src, /dock/);
  assert.match(src, /compact/);
  assert.match(src, /stage/);
  assert.match(src, /tf-lyrics-stage/);
  assert.match(src, /Public discussion/);
});

test("package.json scripts are present", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.name, "trapfarsi");
  assert.ok(pkg.scripts?.test);
  assert.ok(pkg.scripts?.check);
});

test("supabase config exposes only public placeholders", () => {
  const src = read("supabase-config.js");
  assert.match(src, /TRAPFARSI_SUPABASE_URL/);
  assert.match(src, /TRAPFARSI_SUPABASE_ANON_KEY/);
  // Ensure no actual secret assignment — comment may mention service_role as a warning.
  assert.doesNotMatch(src, /TRAPFARSI_SUPABASE.*=\s*["'][^"']*service_role/i);
  assert.match(src, /Never put a service_role key/);
});

test("schema defines core tables and RLS", () => {
  const sql = read("supabase-schema.sql");
  for (const table of [
    "listener_data",
    "community_posts",
    "community_comments",
    "community_post_likes",
    "saved_community_posts",
    "listener_follows",
    "listener_profiles",
    "community_reports"
  ]) {
    assert.match(sql, new RegExp(`create table if not exists public\\.${table}`));
  }
  assert.match(sql, /enable row level security/);
  assert.match(sql, /listener_follows/);
  assert.match(sql, /listener_profiles/);
});

test("cloud module includes public profile and follow flow", () => {
  const src = read("cloud.js");
  assert.match(src, /function openListenerProfile/);
  assert.match(src, /function ensureOwnProfile/);
  assert.match(src, /listener_follows/);
  assert.match(src, /listener_profiles/);
  assert.match(src, /post-author-link/);
});

test("index.html exposes primary routes and player shell", () => {
  const html = read("index.html");
  for (const page of ["home", "releases", "artists", "library", "search", "profile", "community"]) {
    assert.match(html, new RegExp(`data-page="${page}"`));
  }
  assert.match(html, /tf-community-posts|tf-post-submit/);
  assert.match(html, /manifest\.json/);
});

test("service worker caches app shell", () => {
  const sw = read("sw.js");
  assert.match(sw, /trapfarsi-shell/);
  assert.match(sw, /\.\/index\.html/);
  assert.match(sw, /\.\/cloud\.js/);
  assert.match(sw, /phase12\.js/);
  assert.match(sw, /phase12\.css/);
});

test("manifest is installable", () => {
  const manifest = JSON.parse(read("manifest.json"));
  assert.equal(manifest.short_name, "TRAPFARSI");
  assert.equal(manifest.display, "standalone");
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length > 0);
});


test("phase08 studio max features are present", () => {
  const src = read("phase08.js");
  assert.match(src, /tf-night/);
  assert.match(src, /shuffle/);
  assert.match(src, /repeat/);
  assert.match(src, /Share to discussion|data-tf-share/);
  assert.match(src, /Space/);
});


test("i18n supports English, Russian, and Persian", () => {
  const src = read("i18n.js");
  assert.match(src, /en:/);
  assert.match(src, /ru:/);
  assert.match(src, /fa:/);
  assert.match(src, /tf-rtl|dir.*rtl/);
  assert.match(src, /nav_community/);
  assert.match(src, /فارسی/);
});


test("phase09 profile and channel icons exist", () => {
  assert.ok(existsSync(join(root, "icons/trapfarsi-icons.svg")));
  assert.ok(existsSync(join(root, "icons/logo-app.svg")));
  assert.ok(existsSync(join(root, "icons/logo-mark.svg")));
  const src = read("phase09.js");
  assert.match(src, /tf-profile-hero/);
  assert.match(src, /avatarMarks|AVATAR_KEY/);
  assert.match(src, /channelIcons/);
});

test("all first-party JavaScript modules parse", async () => {
  const { spawnSync } = await import("node:child_process");
  for (const file of ["cloud.js", "studio.js", "phase08.js", "phase09.js", "phase10.js", "phase11.js", "phase12.js", "i18n.js", "supabase-config.js", "sw.js"]) {
    const result = spawnSync(process.execPath, ["--check", file], { cwd: root, encoding: "utf8" });
    assert.equal(result.status, 0, `${file} syntax error: ${result.stderr}`);
  }
});

test("local-first playback and core accessibility affordances exist", () => {
  const html = read("index.html");
  assert.match(html, /audio/i);
  assert.match(html, /type="file"/);
  assert.match(html, /aria-label=/);
  assert.match(html, /data-page="lyrics"/);
  assert.match(html, /data-page="community"/);
  assert.match(html, /localStorage/);
});

test("brand icon gallery contains the requested monoline icon families", () => {
  const icons = read("icons/trapfarsi-icons.svg");
  for (const name of ["play", "pause", "next", "prev", "shuffle", "repeat", "lyrics", "discuss", "library", "search", "profile", "heart", "star", "fire", "moon", "globe", "badge", "share", "queue", "disc", "note", "wave"]) {
    assert.match(icons, new RegExp(`id=["']tf-(?:logo-)?${name}["']`, "i"), `missing icon ${name}`);
  }
});


test("Phase 10 discovery lab uses local activity and mood controls", () => {
  const src = read("phase10.js");
  assert.match(src, /Discovery Lab/);
  assert.match(src, /Music DNA/);
  assert.match(src, /tf_history_v1/);
  assert.match(src, /tf_favorites_v1/);
  assert.match(src, /data-mood/);
  assert.match(src, /not a streaming chart/i);
});

test("lyric-aware search supports local notes and optional licensed provider", () => {
  assert.ok(existsSync(join(root, "phase11.js")));
  assert.ok(existsSync(join(root, "phase11.css")));
  assert.ok(existsSync(join(root, "supabase/functions/lyrics-search/index.ts")));
  const ui = read("index.html");
  assert.match(ui, /data-search-type="Lyrics"/);
  assert.match(ui, /phase11\.js/);
  const module = read("phase11.js");
  assert.match(module, /tf_lyrics_notes_v1/);
  assert.match(module, /TRAPFARSI_LYRICS_SEARCH_URL/);
  assert.match(module, /Search music by title, artist, or lyric phrase/);
  const edge = read("supabase/functions/lyrics-search/index.ts");
  assert.match(edge, /MUSIXMATCH_API_KEY/);
  assert.match(edge, /q_lyrics/);
  assert.match(edge, /track_share_url/);
  assert.doesNotMatch(edge, /lyrics_body|full_lyrics/);
});

test("lyrics provider secret is not exposed in browser config", () => {
  const config = read("supabase-config.js");
  assert.match(config, /TRAPFARSI_LYRICS_SEARCH_URL/);
  assert.doesNotMatch(config, /MUSIXMATCH_API_KEY\s*=/);
  assert.match(read("sw.js"), /phase11\.js/);
});


test("Phase 12 includes local audio persistence, sleep timer, and local data portability", () => {
  const phase12 = read("phase12.js");
  assert.match(phase12, /indexedDB\.open/);
  assert.match(phase12, /Remember imported audio in this browser/);
  assert.match(phase12, /TRAPFARSI_LOCAL_BACKUP/);
  assert.match(phase12, /validateBackup/);
  assert.match(phase12, /Sleep timer/);
  assert.match(phase12, /recordRealPlay/);
  assert.match(phase12, /demonstration metadata, not an audio stream/);
  assert.match(read("index.html"), /phase12\.js/);
  assert.match(read("index.html"), /phase12\.css/);
});

test("lyric filter setup does not append a duplicate Lyrics button", () => {
  const phase11 = read("phase11.js");
  assert.match(phase11, /if \(!filters\.querySelector\('button\[data-search-type="Lyrics"\]'\)\)/);
});

test("lyrics search has server-side rate limiting that fails closed", () => {
  const edge = read("supabase/functions/lyrics-search/index.ts");
  const sql = read("supabase-schema.sql");
  assert.match(edge, /rateLimitRequest/);
  assert.match(edge, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(edge, /status: 429|json\(\{ error: "Search limit reached\..*429/s);
  assert.match(edge, /Fail closed/);
  assert.match(sql, /trapfarsi_api_rate_limits/);
  assert.match(sql, /trapfarsi_check_and_increment_rate_limit/);
  assert.match(sql, /grant execute on function public\.trapfarsi_check_and_increment_rate_limit.*to service_role/is);
  assert.match(read("README.md"), /12 requests per IP fingerprint per 60-second window/);
});


test("legacy listening history is preserved but excluded from verified achievements", () => {
  const phase12 = read("phase12.js");
  const html = read("index.html");
  assert.match(phase12, /legacyUnverified: true/);
  assert.match(phase12, /preservedHistory/);
  assert.match(html, /Legacy demo activity · not verified/);
  assert.match(html, /history\.filter\(x=>x&&x\.artist==="Local audio"&&!x\.legacyUnverified\)/);
});

test("local playback queue labels imported files rather than demo artists", () => {
  const phase12 = read("phase12.js");
  assert.match(phase12, /#np-queue-list \.np-queue-row/);
  assert.match(phase12, /LOCAL AUDIO · \$\{queued\.fileName/);
  assert.match(phase12, /addEventListener\("loadedmetadata"/);
});


test("launch packaging includes deploy presets, security docs, and CI", () => {
  for (const file of ["DEPLOYMENT.md", "PRIVACY.md", "SECURITY.md", "netlify.toml", "vercel.json", ".github/workflows/quality.yml", ".gitignore"]) {
    assert.ok(existsSync(join(root, file)), `missing ${file}`);
  }
  const netlify = read("netlify.toml");
  assert.match(netlify, /X-Content-Type-Options/);
  assert.match(netlify, /Referrer-Policy/);
  assert.match(netlify, /Permissions-Policy/);
  const vercel = JSON.parse(read("vercel.json"));
  assert.ok(vercel.headers.some(entry => entry.source === "/(.*)"));
  assert.match(read(".github/workflows/quality.yml"), /npm test/);
  assert.match(read(".github/workflows/quality.yml"), /npm run check/);
});

test("page includes social metadata and a keyboard skip link", () => {
  const html = read("index.html");
  assert.match(html, /property="og:title"/);
  assert.match(html, /name="twitter:card"/);
  assert.match(html, /class="skip-link" href="#main-content"/);
  assert.match(html, /<main id="main-content" tabindex="-1">/);
  assert.match(read("phase12.css"), /prefers-reduced-motion:reduce/);
});
