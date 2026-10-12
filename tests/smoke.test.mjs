import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const cloud = await readFile(new URL("../cloud.js", import.meta.url), "utf8");
const config = await readFile(new URL("../supabase-config.js", import.meta.url), "utf8");
const schema = await readFile(new URL("../supabase-schema.sql", import.meta.url), "utf8");
const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");

test("embedded application JavaScript parses", () => {
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
  assert.ok(scripts.length >= 1, "expected an inline application script");
  for (const [, source] of scripts) new vm.Script(source, { filename: "index.html:inline-script" });
});

test("cloud integration JavaScript parses", () => {
  new vm.Script(cloud, { filename: "cloud.js" });
});

test("core navigation and player surfaces remain present", () => {
  for (const route of ["home", "releases", "artists", "library", "search", "album", "now-playing", "profile", "community", "lyrics"]) {
    assert.match(html, new RegExp('data-page="' + route + '"'));
  }
  for (const id of ["tf-post-submit", "tf-feed-filter", "tf-community-posts", "tf-post-text"]) {
    assert.ok(html.includes('id="' + id + '"'), "missing " + id);
  }
  assert.match(html, /tfPlayTrack/);
  assert.match(html, /tfPlayLocalTrack/);
});

test("Supabase config contains no populated privileged key", () => {
  assert.match(config, /TRAPFARSI_SUPABASE_URL = ""/);
  assert.match(config, /TRAPFARSI_SUPABASE_ANON_KEY = ""/);
  assert.doesNotMatch(config, /service_role|secret_key/i);
});

test("private and community tables have row-level security", () => {
  for (const table of ["listener_data", "community_posts", "community_comments", "community_post_likes", "saved_community_posts", "listener_follows", "listener_profiles", "community_reports"]) {
    assert.match(schema, new RegExp("alter table public\." + table + " enable row level security", "i"), table);
  }
  assert.match(schema, /auth\.uid\(\) = user_id/i);
  assert.match(schema, /trapfarsi_limit_community_posts/);
  assert.match(schema, /trapfarsi_validate_comment/);
});

test("documentation states external setup and limitations", () => {
  assert.match(readme, /supabase-schema\.sql/);
  assert.match(readme, /not been verified/i);
  assert.match(readme, /service_role/i);
});
