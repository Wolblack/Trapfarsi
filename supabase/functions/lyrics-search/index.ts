// Server-side proxy for licensed lyric-metadata search. Never returns full lyrics.
// Configure MUSIXMATCH_API_KEY as a Supabase Edge Function secret.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};
const json = (body: unknown, status = 200, extraHeaders: Record<string, string> = {}) => new Response(JSON.stringify(body), { status, headers: { ...cors, ...extraHeaders } });

async function rateLimitRequest(req: Request): Promise<{ allowed: boolean; retryAfter: number } | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return null;
  // Prefer platform-provided client IP headers. Hash with a server-only secret so
  // this table does not store raw IP addresses or a trivially reversible plain hash.
  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${serviceKey}:${ip}`));
  const fingerprint = Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, "0")).join("");
  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/trapfarsi_check_and_increment_rate_limit`, {
    method: "POST",
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_fingerprint: fingerprint, p_window_seconds: 60, p_limit: 12 }),
    signal: AbortSignal.timeout(4000),
  });
  if (!response.ok) throw new Error("Rate-limit store unavailable");
  const payload = await response.json();
  const row = Array.isArray(payload) ? payload[0] : payload;
  if (!row || typeof row.allowed !== "boolean") throw new Error("Rate-limit store returned an invalid response");
  return { allowed: row.allowed, retryAfter: Math.max(1, Number(row.retry_after_seconds) || 60) };
}
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const key = Deno.env.get("MUSIXMATCH_API_KEY");
  if (!key) return json({ error: "Lyrics provider is not configured" }, 503);
  let query = "";
  try {
    const bodyText = await req.text();
    if (bodyText.length > 8192) return json({ error: "Request body is too large" }, 413);
    const body = JSON.parse(bodyText);
    query = String(body?.query || "").trim();
  } catch { return json({ error: "Invalid JSON" }, 400); }
  if (query.length < 2 || query.length > 160) return json({ error: "Query must contain 2–160 characters" }, 400);
  try {
    const limit = await rateLimitRequest(req);
    if (!limit) return json({ error: "Server-side rate limiting is not configured" }, 503);
    if (!limit.allowed) return json({ error: "Search limit reached. Try again shortly." }, 429, { "Retry-After": String(limit.retryAfter) });
  } catch {
    // Fail closed: never spend the provider quota when the rate-limit store is unavailable.
    return json({ error: "Search protection is temporarily unavailable" }, 503);
  }
  // Provider key stays server-side. Return metadata and provider links, never full lyrics.
  const url = new URL("https://api.musixmatch.com/ws/1.1/track.search");
  url.searchParams.set("q_lyrics", query);
  url.searchParams.set("page", "1");
  url.searchParams.set("page_size", "10");
  url.searchParams.set("s_track_rating", "desc");
  url.searchParams.set("f_has_lyrics", "1");
  url.searchParams.set("apikey", key);
  try {
    const upstream = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(9000) });
    if (!upstream.ok) return json({ error: "Lyrics provider request failed" }, 502);
    const payload = await upstream.json();
    const header = payload?.message?.header;
    if (!header || header.status_code !== 200) return json({ error: "Lyrics provider rejected the search" }, 502);
    const tracks = payload?.message?.body?.track_list || [];
    const results = tracks.map((entry: any) => entry?.track || {}).filter((t: any) => t.track_name && t.artist_name).map((t: any) => ({
      title: String(t.track_name).slice(0, 200),
      artist: String(t.artist_name).slice(0, 200),
      album: String(t.album_name || "").slice(0, 200),
      cover: typeof t.album_coverart_100x100 === "string" ? t.album_coverart_100x100 : "",
      url: typeof t.track_share_url === "string" ? t.track_share_url : "",
      snippet: "Matched by lyric phrase. Open the provider page for available details.",
    }));
    return json({ results, provider: "Musixmatch", attribution: "Music metadata provided by Musixmatch" });
  } catch { return json({ error: "Lyrics provider timed out" }, 504); }
});
