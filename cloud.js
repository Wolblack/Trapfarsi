/* TRAPFARSI cloud integration.
 * Local-only mode remains available when Supabase is not configured.
 * Conflict policy: cloud wins for keys already present in the account; local data
 * is bootstrapped only for keys absent from the account. This avoids stale local
 * writes silently replacing newer cloud data. No privileged key belongs here.
 */
(() => {
  "use strict";
  const cfgUrl = window.TRAPFARSI_SUPABASE_URL || "";
  const cfgKey = window.TRAPFARSI_SUPABASE_ANON_KEY || "";
  const enabled = Boolean(cfgUrl && cfgKey && window.supabase?.createClient);
  const keys = {
    profile: "tf_profile_v1",
    playlists: "tf_playlists_v1",
    community_posts: "tf_community_posts_v1",
    lyrics_notes: "tf_lyrics_notes_v1"
  };
  const categories = new Set(["US Rap", "Persian Rap", "R&B", "Rock & Alternative", "New Releases", "Music Talk"]);
  let client = null;
  let currentUser = null;
  let suppressSync = false;
  let loadGeneration = 0;
  const timers = new Map();
  const $ = id => document.getElementById(id);
  const localRead = key => {
    try { const raw = localStorage.getItem(keys[key]); return raw === null ? null : JSON.parse(raw); }
    catch (_) { return null; }
  };
  const localWrite = (key, value) => {
    try { suppressSync = true; localStorage.setItem(keys[key], JSON.stringify(value)); return true; }
    catch (_) { return false; }
    finally { suppressSync = false; }
  };
  const status = msg => { const el = $("tf-cloud-status"); if (el) el.textContent = msg; };
  const toast = msg => { const el = $("toast"); if (el) { el.textContent = msg; el.classList.add("show"); setTimeout(() => el.classList.remove("show"), 2600); } };
  const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function addStyles() {
    if ($("tf-cloud-style")) return;
    const style = document.createElement("style");
    style.id = "tf-cloud-style";
    style.textContent = `
      .tf-cloud-panel{margin:0 0 22px;padding:20px;border:1px solid rgba(35,42,55,.1);border-radius:22px;background:rgba(255,255,255,.72);box-shadow:0 10px 34px rgba(30,40,60,.05)}
      .tf-cloud-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}.tf-cloud-row input{flex:1;min-width:180px}
      .tf-cloud-status{font-size:12px;color:#657080;margin:8px 0 0}.tf-cloud-panel h2{margin:0 0 6px}.tf-cloud-panel p{margin:0 0 12px}
      .tf-cloud-panel .community-input{box-sizing:border-box;width:100%;margin:6px 0 10px}
    `;
    document.head.append(style);
  }
  function mountPanel() {
    const page = $("page-profile");
    if (!page || $("tf-cloud-panel")) return;
    addStyles();
    const panel = document.createElement("section");
    panel.id = "tf-cloud-panel";
    panel.className = "tf-cloud-panel";
    panel.innerHTML = `<div class="eyebrow">ACCOUNT & SYNC</div><h2 id="tf-cloud-heading">Make your library yours.</h2><p id="tf-cloud-copy">Sign in by email to sync your profile and playlists across devices and join the shared community.</p><div id="tf-cloud-controls"><div class="tf-cloud-row"><input class="community-input" id="tf-cloud-email" type="email" autocomplete="email" placeholder="you@example.com" aria-label="Email address"><button class="primary-button" id="tf-cloud-send">Email me a sign-in link</button></div></div><div class="tf-cloud-status" id="tf-cloud-status" role="status" aria-live="polite"></div>`;
    const heading = page.querySelector(".route-heading");
    if (heading) heading.insertAdjacentElement("afterend", panel);
    $("tf-cloud-send")?.addEventListener("click", sendLink);
    if (!enabled) {
      status("Cloud is not configured. Local-only mode is available; configure Supabase to enable shared accounts and posts.");
      if ($("tf-cloud-send")) { $("tf-cloud-send").disabled = true; $("tf-cloud-send").title = "Configure Supabase first"; }
    } else status("Cloud configured. Email sign-in uses a magic link; no password is stored in this app.");
  }
  async function sendLink() {
    const email = $("tf-cloud-email")?.value.trim();
    if (!enabled || !client) { status("Configure Supabase first."); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { status("Enter a valid email address."); return; }
    const button = $("tf-cloud-send");
    if (button) button.disabled = true;
    try {
      const { error } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: location.href.split("#")[0] } });
      if (error) throw error;
      status("Sign-in link sent. Open the email to finish signing in.");
    } catch (e) { status(e.message || "Could not send sign-in link."); }
    finally { if (button) button.disabled = false; }
  }
  function renderSignedIn(user) {
    const controls = $("tf-cloud-controls");
    if (!controls) return;
    controls.replaceChildren();
    const row = document.createElement("div"); row.className = "tf-cloud-row";
    const label = document.createElement("strong"); label.textContent = user.email || "Signed in listener";
    const button = document.createElement("button"); button.className = "secondary-button"; button.textContent = "Sign out"; button.id = "tf-cloud-signout";
    button.addEventListener("click", signOut);
    row.append(label, button); controls.append(row);
    $("tf-cloud-heading").textContent = "Your account is connected.";
    $("tf-cloud-copy").textContent = "Account data syncs privately. Community posts are shared with other visitors when you publish while signed in.";
  }
  function renderSignedOut() {
    const controls = $("tf-cloud-controls");
    if (!controls) return;
    controls.replaceChildren();
    const row = document.createElement("div"); row.className = "tf-cloud-row";
    const input = document.createElement("input"); input.className = "community-input"; input.id = "tf-cloud-email"; input.type = "email"; input.autocomplete = "email"; input.placeholder = "you@example.com"; input.setAttribute("aria-label", "Email address");
    const button = document.createElement("button"); button.className = "primary-button"; button.id = "tf-cloud-send"; button.textContent = "Email me a sign-in link"; button.disabled = !enabled;
    button.addEventListener("click", sendLink);
    row.append(input, button); controls.append(row);
    $("tf-cloud-heading").textContent = "Make your library yours.";
    $("tf-cloud-copy").textContent = "Sign in by email to sync your profile and playlists across devices and join the shared community.";
  }
  async function pushKey(key) {
    if (!client || !currentUser || suppressSync) return;
    const value = localRead(key);
    if (value === null) return;
    const { error } = await client.from("listener_data").upsert({
      user_id: currentUser.id, data_key: key, value, updated_at: new Date().toISOString()
    }, { onConflict: "user_id,data_key" });
    if (error) throw error;
  }
  function scheduleSync(key) {
    if (!currentUser || suppressSync) return;
    clearTimeout(timers.get(key));
    timers.set(key, setTimeout(() => {
      pushKey(key).catch(e => status("Sync issue: " + (e.message || "retry after reconnecting.")));
    }, 500));
  }
  async function loadAccountData() {
    if (!client || !currentUser) return;
    const generation = ++loadGeneration;
    const { data, error } = await client.from("listener_data")
      .select("data_key,value,updated_at").eq("user_id", currentUser.id);
    if (error) throw error;
    if (generation !== loadGeneration || !currentUser) return;
    const cloudKeys = new Set();
    for (const row of data || []) {
      if (!Object.hasOwn(keys, row.data_key)) continue;
      cloudKeys.add(row.data_key);
      localWrite(row.data_key, row.value);
    }
    // Bootstrap only absent cloud keys. Never overwrite a cloud record with a
    // local snapshot merely because it was edited earlier on another device.
    for (const key of ["profile", "playlists", "lyrics_notes"]) {
      if (!cloudKeys.has(key) && localRead(key) !== null) await pushKey(key);
    }
    if (typeof window.tfRenderProfile === "function") window.tfRenderProfile();
    if (typeof window.tfRenderCommunity === "function") window.tfRenderCommunity();
    status("Account data loaded. Existing cloud records take precedence; local data was uploaded only for missing keys.");
  }
  async function signOut() {
    if (!client) return;
    const { error } = await client.auth.signOut();
    if (error) { status(error.message); return; }
    currentUser = null; loadGeneration++; renderSignedOut();
    status("Signed out. This device's local copy remains available.");
    await loadCommunity();
  }
  function renderSharedPosts(posts) {
    const box = $("tf-community-posts");
    if (!box) return;
    box.replaceChildren();
    if (!posts.length) {
      const empty = document.createElement("article"); empty.className = "glass community-post";
      const h = document.createElement("h3"); h.textContent = "No shared conversations yet.";
      const p = document.createElement("p"); p.textContent = "Be the first to start a conversation in this channel.";
      empty.append(h, p); box.append(empty); return;
    }
    posts.forEach(post => {
      const card = document.createElement("article"); card.className = "glass community-post";
      const top = document.createElement("div"); top.className = "post-top";
      const avatar = document.createElement("div"); avatar.className = "post-avatar"; avatar.textContent = (post.author_name || "L").slice(0, 1).toUpperCase();
      const who = document.createElement("div");
      const author = document.createElement("div"); author.className = "post-author"; author.textContent = post.author_name || "Listener";
      const time = document.createElement("div"); time.className = "post-time"; time.textContent = new Date(post.created_at).toLocaleString();
      who.append(author, time);
      const tag = document.createElement("span"); tag.className = "post-category"; tag.textContent = post.category;
      top.append(avatar, who, tag);
      const body = document.createElement("p"); body.className = "post-body"; body.textContent = post.body;
      const foot = document.createElement("div"); foot.className = "post-footer";
      const stamp = document.createElement("span"); stamp.textContent = "SHARED COMMUNITY"; foot.append(stamp);
      if (currentUser && post.user_id === currentUser.id) {
        const del = document.createElement("button"); del.className = "text-action danger"; del.textContent = "Delete post";
        del.addEventListener("click", async () => {
          del.disabled = true;
          const { error } = await client.from("community_posts").delete().eq("id", post.id);
          if (error) { del.disabled = false; status("Could not delete post: " + error.message); return; }
          await loadCommunity();
        });
        foot.append(del);
      }
      card.append(top, body, foot); box.append(card);
    });
  }
  async function loadCommunity() {
    if (!client) return;
    try {
      let query = client.from("community_posts").select("id,user_id,author_name,category,body,created_at")
        .order("created_at", { ascending: false }).limit(100);
      const { data, error } = await query;
      if (error) throw error;
      const filter = $("tf-feed-filter")?.value || "All topics";
      renderSharedPosts((data || []).filter(p => filter === "All topics" || p.category === filter));
    } catch (e) {
      status("Shared community could not load. Check Supabase configuration and RLS: " + (e.message || "network error."));
    }
  }
  async function publishSharedPost() {
    if (!client || !currentUser) { status("Sign in to publish to the shared community. Your post was not published."); return; }
    const input = $("tf-post-text");
    const body = input?.value.trim() || "";
    const category = $("tf-post-category")?.value || "Music Talk";
    if (!body) { toast("Write a post first."); return; }
    if (body.length > 600 || !categories.has(category)) { status("Post text or channel is invalid."); return; }
    const profile = localRead("profile");
    const authorName = String(profile?.name || currentUser.email?.split("@")[0] || "Listener").trim().slice(0, 32) || "Listener";
    const button = $("tf-post-submit");
    if (button) button.disabled = true;
    try {
      const { error } = await client.from("community_posts").insert({ user_id: currentUser.id, author_name: authorName, category, body });
      if (error) throw error;
      if (input) input.value = "";
      if ($("tf-post-counter")) $("tf-post-counter").textContent = "0 / 600";
      await loadCommunity();
      status("Post published to the shared community.");
    } catch (e) { status("Shared post failed; your text remains in the editor. " + (e.message || "Try again.")); }
    finally { if (button) button.disabled = false; }
  }
  function bindCommunity() {
    const submit = $("tf-post-submit");
    submit?.addEventListener("click", event => {
      // When cloud is configured, never also run the local-preview handler.
      // This prevents a failed shared publish from appearing as a false success.
      if (!enabled) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      publishSharedPost().catch(e => status(e.message || "Could not publish shared post."));
    }, true);
    $("tf-feed-filter")?.addEventListener("change", () => loadCommunity());
  }
  async function init() {
    mountPanel();
    bindCommunity();
    if (!enabled) return;
    client = window.supabase.createClient(cfgUrl, cfgKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    // Community is public-readable under the supplied RLS policies.
    await loadCommunity();
    try {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      if (data.session) {
        currentUser = data.session.user; renderSignedIn(currentUser);
        try { await loadAccountData(); } catch (e) { status("Signed in, but account sync failed: " + (e.message || "check database setup.")); }
      }
    } catch (e) { status("Could not restore sign-in session: " + (e.message || "try refreshing.")); }
    client.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        currentUser = session.user; renderSignedIn(currentUser);
        // Defer Supabase work outside the auth callback to avoid lock contention.
        setTimeout(async () => {
          try { await loadAccountData(); } catch (e) { status("Account sync failed: " + (e.message || "check database setup.")); }
          await loadCommunity();
        }, 0);
      } else if (event === "SIGNED_OUT") {
        currentUser = null; loadGeneration++; renderSignedOut(); loadCommunity();
      }
    });
    // Same-tab changes sync through this wrapper; remote tabs use the storage event.
    const originalSet = Storage.prototype.setItem;
    if (!Storage.prototype.__tfCloudWrapped) {
      Storage.prototype.setItem = function(k, v) {
        originalSet.call(this, k, v);
        if (this === localStorage && !suppressSync) {
          const key = Object.keys(keys).find(name => keys[name] === k);
          if (key) scheduleSync(key);
        }
      };
      Object.defineProperty(Storage.prototype, "__tfCloudWrapped", { value: true });
    }
    window.addEventListener("storage", e => {
      const key = Object.keys(keys).find(name => keys[name] === e.key);
      if (key) scheduleSync(key);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
