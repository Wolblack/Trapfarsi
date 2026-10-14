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
  const cloudVersions = new Map();
  const timers = new Map();
  const COMMUNITY_PAGE_SIZE = 30;
  let communityOffset = 0;
  let communityHasMore = false;
  let communityLoading = false;
  let communityLoadGeneration = 0;
  let communityPostsCache = [];
  let communityPaginationLangBound = false;
  let profileSyncTimer = null;
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
      .tf-comment-thread{border-top:1px solid rgba(100,110,125,.16);margin-top:14px;padding-top:12px}
      .tf-comment-thread h4{font-size:13px;margin:0 0 10px}
      .tf-comment{padding:10px 0;border-bottom:1px solid rgba(100,110,125,.12)}
      .tf-comment p{white-space:pre-wrap;overflow-wrap:anywhere;margin:0 0 5px}
      .post-author-link{cursor:pointer;text-decoration:underline;text-underline-offset:3px;background:none;border:0;padding:0;font:inherit;color:inherit}
      .post-author-link:hover{opacity:.75}
      .tf-listener-modal{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(20,24,32,.42);backdrop-filter:blur(8px)}
      .tf-listener-modal[hidden]{display:none}
      .tf-listener-card{width:min(440px,100%);max-height:min(86vh,640px);overflow:auto;padding:24px;border-radius:24px;background:rgba(255,255,255,.94);box-shadow:0 24px 60px rgba(20,30,50,.18);border:1px solid rgba(255,255,255,.7)}
      .tf-listener-card h2{margin:0 0 6px;font:800 26px/1.15 Manrope,sans-serif;letter-spacing:-.8px}
      .tf-listener-card .tf-listener-bio{color:#6b7280;font-size:13px;line-height:1.7;margin:0 0 14px;white-space:pre-wrap}
      .tf-listener-meta{display:flex;gap:18px;flex-wrap:wrap;margin:0 0 16px;font-size:12px;color:#657080}
      .tf-listener-meta strong{display:block;font-size:18px;color:#1f2937}
      .tf-listener-actions{display:flex;gap:10px;flex-wrap:wrap}
      .tf-listener-avatar{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;font:800 22px Manrope,sans-serif;background:linear-gradient(145deg,#fff,#e5e9f0);box-shadow:6px 6px 16px #c5ccd655,-6px -6px 16px #fff;margin-bottom:12px;overflow:hidden}
      .tf-listener-avatar img{display:block;width:100%;height:100%;object-fit:cover;border-radius:50%}
      .tf-comment small{font-size:11px;color:#737d8b}
      .tf-reply{margin:8px 0 8px 14px;padding:8px 10px;border-left:2px solid rgba(100,110,125,.3);font-size:13px}
      .tf-comment-thread textarea{box-sizing:border-box;width:100%;margin:10px 0 8px;resize:vertical}
      .tf-comment-thread button{margin:3px 6px 3px 0}
      @media(prefers-reduced-motion:reduce){.tf-comment-thread *{scroll-behavior:auto!important;transition:none!important}}
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
    const userId = currentUser.id;
    const value = localRead(key);
    if (value === null) return;
    // Optimistic concurrency: never overwrite a cloud revision that changed since
    // this tab last read it. This is intentionally safer than blind upsert.
    const { data: remote, error: readError } = await client.from("listener_data")
      .select("updated_at").eq("user_id", userId).eq("data_key", key).maybeSingle();
    if (readError) throw readError;
    if (currentUser?.id !== userId) return;
    const knownVersion = cloudVersions.get(key);
    if (!remote && knownVersion) {
      status("Sync conflict for " + key + ": the cloud record was removed elsewhere. Local data was kept and not recreated automatically.");
      return;
    }
    if (remote && !knownVersion) {
      cloudVersions.set(key, remote.updated_at);
      status("Sync conflict for " + key + ": cloud data already exists. Local changes were not uploaded; refresh/review before retrying.");
      return;
    }
    if (remote && remote.updated_at !== knownVersion) {
      cloudVersions.set(key, remote.updated_at);
      status("Sync conflict for " + key + ": a newer cloud revision exists. Your local data was kept on this device and not uploaded.");
      return;
    }
    const updatedAt = new Date().toISOString();
    if (remote) {
      const { data, error } = await client.from("listener_data")
        .update({ value, updated_at: updatedAt })
        .eq("user_id", userId).eq("data_key", key).eq("updated_at", knownVersion)
        .select("updated_at").maybeSingle();
      if (error) throw error;
      if (!data) {
        status("Sync conflict for " + key + ": another device saved first. Local changes were kept and not uploaded.");
        return;
      }
      cloudVersions.set(key, data.updated_at);
    } else {
      const { data, error } = await client.from("listener_data")
        .insert({ user_id: userId, data_key: key, value, updated_at: updatedAt })
        .select("updated_at").single();
      if (error) {
        if (error.code === "23505") {
          status("Sync conflict for " + key + ": another device created this record first. Local changes were not uploaded.");
          return;
        }
        throw error;
      }
      cloudVersions.set(key, data.updated_at);
    }
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
    cloudVersions.clear();
    for (const row of data || []) {
      if (!Object.hasOwn(keys, row.data_key)) continue;
      cloudKeys.add(row.data_key);
      cloudVersions.set(row.data_key, row.updated_at);
      localWrite(row.data_key, row.value);
    }
    // Bootstrap only absent cloud keys. Never overwrite a cloud record with a
    // local snapshot merely because it was edited earlier on another device.
    for (const key of ["profile", "playlists", "lyrics_notes"]) {
      if (!cloudKeys.has(key) && localRead(key) !== null) await pushKey(key);
    }
    if (typeof window.tfRenderProfile === "function") window.tfRenderProfile();
    if (typeof window.tfRenderCommunity === "function") window.tfRenderCommunity();
    status("Account data loaded. Cloud revisions are tracked; conflicting updates are blocked rather than silently overwriting newer data.");
  }
  async function signOut() {
    if (!client) return;
    const { error } = await client.auth.signOut();
    if (error) { status(error.message); return; }
    currentUser = null; loadGeneration++; cloudVersions.clear(); renderSignedOut();
    status("Signed out. This device's local copy remains available.");
    await loadCommunity();
  }
  const el = (tag, cls, value) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (value !== undefined) node.textContent = value;
    return node;
  };
  function renderCommunityPagination() {
    const box = $("tf-community-posts");
    if (!box) return;
    let button = $("tf-community-load-more");
    if (!button) {
      button = el("button", "secondary-button", "Load more conversations");
      button.id = "tf-community-load-more";
      button.type = "button";
      button.addEventListener("click", () => loadCommunity({ append: true }));
      box.insertAdjacentElement("afterend", button);
    }
    button.hidden = !communityHasMore;
    button.disabled = communityLoading;
    const translate = key => window.tfI18n?.t?.(key) || (key === "community_loading" ? "Loading conversations…" : "Load more conversations");
    button.textContent = translate(communityLoading ? "community_loading" : "community_load_more");
    button.setAttribute("aria-live", "polite");
    if (!communityPaginationLangBound) {
      window.addEventListener("tf:lang", renderCommunityPagination);
      communityPaginationLangBound = true;
    }
  }
  function scheduleOwnProfileSync() {
    if (!client || !currentUser) return;
    clearTimeout(profileSyncTimer);
    profileSyncTimer = setTimeout(() => {
      syncOwnProfile(localRead("profile") || {}).catch(error => {
        status("Profile sync issue: " + (error.message || "check the profile migration and try again."));
      });
    }, 300);
  }
  async function togglePostLike(postId, liked) {
    if (!currentUser) { status("Sign in to like community posts."); return; }
    const result = liked
      ? await client.from("community_post_likes").delete().eq("post_id", postId).eq("user_id", currentUser.id)
      : await client.from("community_post_likes").insert({ post_id: postId, user_id: currentUser.id });
    if (result.error) { status("Like could not be updated: " + result.error.message); return; }
    await loadCommunity();
  }
  async function toggleSavedPost(postId, saved) {
    if (!currentUser) { status("Sign in to save community posts."); return; }
    const result = saved
      ? await client.from("saved_community_posts").delete().eq("post_id", postId).eq("user_id", currentUser.id)
      : await client.from("saved_community_posts").insert({ post_id: postId, user_id: currentUser.id });
    if (result.error) { status("Saved post could not be updated: " + result.error.message); return; }
    await loadCommunity();
  }
  async function addComment(postId, body, parentId = null) {
    if (!currentUser) { status("Sign in to comment."); return; }
    body = String(body || "").trim();
    if (!body || body.length > 1000) { status("Comments must be between 1 and 1,000 characters."); return; }
    const { error } = await client.from("community_comments").insert({
      post_id: postId, user_id: currentUser.id, parent_id: parentId, body
    });
    if (error) { status("Comment could not be published: " + error.message); return; }
    await loadCommunity();
  }
  async function reportPost(postId) {
    if (!currentUser) { status("Sign in to report a post."); return; }
    const reason = window.prompt("Why are you reporting this post? (3–240 characters)");
    if (reason === null) return;
    const clean = reason.trim();
    if (clean.length < 3 || clean.length > 240) { status("Report reason must be 3–240 characters."); return; }
    const { error } = await client.from("community_reports").insert({ reporter_id: currentUser.id, post_id: postId, reason: clean });
    status(error ? "Report could not be submitted: " + error.message : "Report submitted for review.");
  }
  function renderSharedPosts(posts, likes = [], comments = [], saved = new Set(), likeCounts = new Map()) {
    const box = $("tf-community-posts");
    if (!box) return;
    box.replaceChildren();
    if (!posts.length) {
      const empty = el("article", "glass community-post");
      empty.append(el("h3", "", "No shared conversations yet."), el("p", "", "Be the first to start a conversation in this channel."));
      box.append(empty); return;
    }
    const likedIds = new Set(likes.filter(x => currentUser && x.user_id === currentUser.id).map(x => x.post_id));
    posts.forEach(post => {
      const card = el("article", "glass community-post");
      const top = el("div", "post-top");
      const avatar = el("div", "post-avatar", (post.author_name || "L").slice(0, 1).toUpperCase());
      const who = el("div");
      const authorBtn = el("button", "post-author post-author-link", post.author_name || "Listener");
      authorBtn.type = "button";
      authorBtn.title = "View listener profile";
      authorBtn.addEventListener("click", () => openListenerProfile(post.user_id, post.author_name));
      who.append(authorBtn, el("div", "post-time", new Date(post.created_at).toLocaleString()));
      const tag = el("span", "post-category", post.category);
      top.append(avatar, who, tag);
      avatar.style.cursor = "pointer";
      avatar.title = "View listener profile";
      avatar.addEventListener("click", () => openListenerProfile(post.user_id, post.author_name));
      const body = el("p", "post-body", post.body);
      const foot = el("div", "post-footer");
      foot.append(el("span", "", "SHARED COMMUNITY"));
      const liked = likedIds.has(post.id);
      const hasLikeCount = likeCounts.has(post.id);
      const likeCount = hasLikeCount ? likeCounts.get(post.id) : "—";
      const like = el("button", "text-action", (liked ? "♥ Liked" : "♡ Like") + " · " + String(likeCount));
      like.type = "button"; like.setAttribute("aria-pressed", String(liked));
      like.addEventListener("click", () => togglePostLike(post.id, liked));
      const save = el("button", "text-action", saved.has(post.id) ? "Saved" : "Save");
      save.type = "button"; save.setAttribute("aria-pressed", String(saved.has(post.id)));
      save.addEventListener("click", () => toggleSavedPost(post.id, saved.has(post.id)));
      const report = el("button", "text-action", "Report");
      report.type = "button"; report.addEventListener("click", () => reportPost(post.id));
      foot.append(like, save, report);
      if (currentUser && post.user_id === currentUser.id) {
        const edit = el("button", "text-action", "Edit");
        edit.type = "button";
        edit.addEventListener("click", async () => {
          const next = window.prompt("Edit your post (maximum 600 characters)", post.body);
          if (next === null) return;
          const clean = next.trim();
          if (!clean || clean.length > 600) { status("Post must be between 1 and 600 characters."); return; }
          const { error } = await client.from("community_posts").update({ body: clean, updated_at: new Date().toISOString() }).eq("id", post.id).eq("user_id", currentUser.id);
          if (error) status("Could not edit post: " + error.message); else await loadCommunity();
        });
        const del = el("button", "text-action danger", "Delete post");
        del.type = "button";
        del.addEventListener("click", async () => {
          if (!window.confirm("Delete this post and its comments?")) return;
          del.disabled = true;
          const { error } = await client.from("community_posts").delete().eq("id", post.id).eq("user_id", currentUser.id);
          if (error) { del.disabled = false; status("Could not delete post: " + error.message); return; }
          await loadCommunity();
        });
        foot.append(edit, del);
      }
      const thread = el("section", "tf-comment-thread");
      thread.append(el("h4", "", "Conversation · " + comments.filter(x => x.post_id === post.id).length));
      const postComments = comments.filter(x => x.post_id === post.id);
      postComments.filter(x => !x.parent_id).forEach(comment => {
        const item = el("div", "tf-comment");
        item.append(el("p", "", comment.body), el("small", "", new Date(comment.created_at).toLocaleString()));
        if (currentUser && comment.user_id === currentUser.id) {
          const remove = el("button", "text-action danger", "Delete comment");
          remove.type = "button";
          remove.addEventListener("click", async () => {
            const { error } = await client.from("community_comments").delete().eq("id", comment.id).eq("user_id", currentUser.id);
            if (error) status("Could not delete comment: " + error.message); else await loadCommunity();
          });
          item.append(remove);
        }
        const replies = postComments.filter(x => x.parent_id === comment.id);
        replies.forEach(reply => item.append(el("blockquote", "tf-reply", reply.body + " — " + new Date(reply.created_at).toLocaleString())));
        const replyButton = el("button", "text-action", "Reply");
        replyButton.type = "button";
        replyButton.addEventListener("click", async () => {
          const reply = window.prompt("Write a reply (maximum 1,000 characters)");
          if (reply !== null) await addComment(post.id, reply, comment.id);
        });
        item.append(replyButton); thread.append(item);
      });
      const input = el("textarea", "community-input");
      input.rows = 2; input.maxLength = 1000; input.placeholder = currentUser ? "Add to the conversation…" : "Sign in to comment";
      input.setAttribute("aria-label", "Comment");
      const send = el("button", "secondary-button", "Comment");
      send.type = "button"; send.disabled = !currentUser;
      send.addEventListener("click", async () => { send.disabled = true; await addComment(post.id, input.value); });
      thread.append(input, send);
      card.append(top, body, foot, thread); box.append(card);
    });
  }
  async function syncOwnProfile(profile = localRead("profile") || {}) {
    if (!client || !currentUser) return;
    const userId = currentUser.id;
    const displayName = String(profile.name || currentUser.email?.split("@")[0] || "Listener").trim().slice(0, 32) || "Listener";
    const bio = String(profile.bio || "").slice(0, 240);
    const updatedAt = new Date().toISOString();
    // A legacy local profile has no privacy preference. Preserve the stored
    // account setting instead of silently making that account public on sign-in.
    const { data: existingCore, error: existingCoreError } = await client.from("listener_profiles")
      .select("is_public").eq("user_id", userId).maybeSingle();
    if (existingCoreError) throw existingCoreError;
    const isPublic = typeof profile.public === "boolean" ? profile.public : (existingCore?.is_public !== false);
    const coreWrite = {
      user_id: userId, display_name: displayName, bio,
      is_public: isPublic, updated_at: updatedAt
    };
    // Do not erase a remote avatar if a legacy client has never stored the field.
    if (Object.prototype.hasOwnProperty.call(profile, "avatarUrl")) {
      const rawAvatar = String(profile.avatarUrl || "").trim();
      coreWrite.avatar_url = rawAvatar && (rawAvatar.startsWith("https://") || rawAvatar.startsWith("http://")) ? rawAvatar.slice(0, 500) : null;
    }
    const { error: coreError } = await client.from("listener_profiles").upsert(coreWrite, { onConflict: "user_id" });
    if (coreError) throw coreError;

    const extendedWrite = { updated_at: updatedAt };
    if (Object.prototype.hasOwnProperty.call(profile, "handle")) {
      const username = String(profile.handle || "").trim().replace(/^@/, "").toLowerCase();
      extendedWrite.username = /^[a-z0-9_]{3,20}$/.test(username) ? username : null;
    }
    if (Object.prototype.hasOwnProperty.call(profile, "location")) {
      extendedWrite.location = String(profile.location || "").trim().slice(0, 60) || null;
    }
    if (Object.prototype.hasOwnProperty.call(profile, "genres")) {
      extendedWrite.favorite_genres = Array.isArray(profile.genres)
        ? [...new Set(profile.genres.map(value => String(value).trim()).filter(Boolean))].slice(0, 12)
        : [];
    }
    if (Object.keys(extendedWrite).length > 1) {
      const { error: extendedError } = await client.from("listener_profiles").update(extendedWrite).eq("user_id", userId);
      if (extendedError) {
        if (extendedError.code === "42703" || /column .* does not exist/i.test(extendedError.message || "")) {
          status("Core profile synced. Apply the listener profile v2 migration to sync username, location, and genres.");
          return;
        }
        if (extendedError.code === "23505") {
          status("Core profile synced, but that username is already taken. Choose another username and save again.");
          return;
        }
        throw extendedError;
      }
    }
  }
  async function ensureOwnProfile() {
    return syncOwnProfile(localRead("profile") || {});
  }
  function ensureListenerModal() {
    let modal = $("tf-listener-modal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "tf-listener-modal";
    modal.className = "tf-listener-modal";
    modal.hidden = true;
    modal.innerHTML = `<div class="tf-listener-card" role="dialog" aria-modal="true" aria-labelledby="tf-listener-name">
      <div class="tf-listener-avatar" id="tf-listener-avatar">L</div>
      <h2 id="tf-listener-name">Listener</h2>
      <p class="tf-listener-bio" id="tf-listener-bio"></p>
      <p class="small-note" id="tf-listener-profile-meta"></p>
      <div class="tf-listener-meta">
        <div><strong id="tf-listener-followers">0</strong>Followers</div>
        <div><strong id="tf-listener-following">0</strong>Following</div>
        <div><strong id="tf-listener-posts">0</strong>Posts</div>
      </div>
      <div class="tf-listener-actions">
        <button type="button" class="primary-button" id="tf-listener-follow">Follow</button>
        <button type="button" class="text-action" id="tf-listener-close">Close</button>
      </div>
      <p class="small-note" id="tf-listener-status" role="status"></p>
    </div>`;
    document.body.appendChild(modal);
    modal.addEventListener("click", e => { if (e.target === modal) closeListenerProfile(); });
    $("tf-listener-close")?.addEventListener("click", closeListenerProfile);
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && modal && !modal.hidden) closeListenerProfile();
    });
    return modal;
  }
  function renderListenerAvatar(name, avatarUrl, allowImage) {
    const target = $("tf-listener-avatar");
    if (!target) return;
    target.replaceChildren();
    const fallback = String(name || "L").trim().slice(0, 1).toUpperCase() || "L";
    if (allowImage && avatarUrl) {
      try {
        const parsed = new URL(String(avatarUrl), location.origin);
        if (parsed.protocol === "https:" || parsed.protocol === "http:") {
          const image = document.createElement("img");
          image.alt = "";
          image.loading = "lazy";
          image.decoding = "async";
          image.referrerPolicy = "no-referrer";
          image.src = parsed.href;
          image.addEventListener("error", () => { target.replaceChildren(); target.textContent = fallback; }, { once: true });
          target.append(image);
          return;
        }
      } catch (_) { /* invalid avatar URL; use the initials fallback */ }
    }
    target.textContent = fallback;
  }
  function closeListenerProfile() {
    const modal = $("tf-listener-modal");
    if (modal) modal.hidden = true;
  }
  async function openListenerProfile(userId, fallbackName) {
    if (!client || !userId) { status("Profiles require a configured Supabase project."); return; }
    const modal = ensureListenerModal();
    modal.hidden = false;
    $("tf-listener-name").textContent = fallbackName || "Listener";
    renderListenerAvatar(fallbackName || "Listener", null, false);
    $("tf-listener-bio").textContent = "Loading profile…";
    $("tf-listener-profile-meta").textContent = "";
    $("tf-listener-followers").textContent = "–";
    $("tf-listener-following").textContent = "–";
    $("tf-listener-posts").textContent = "–";
    $("tf-listener-status").textContent = "";
    const followBtn = $("tf-listener-follow");
    followBtn.disabled = true;
    followBtn.textContent = "…";
    followBtn.onclick = null;
    try {
      const [{ data: profile }, followCountsResult, { count: posts }, followCheck] = await Promise.all([
        client.from("listener_profiles").select("display_name,bio,is_public,avatar_url").eq("user_id", userId).maybeSingle(),
        client.rpc("listener_follow_counts", { p_user_id: userId }),
        client.from("community_posts").select("*", { count: "exact", head: true }).eq("user_id", userId),
        currentUser
          ? client.from("listener_follows").select("follower_id").eq("follower_id", currentUser.id).eq("followed_id", userId).maybeSingle()
          : Promise.resolve({ data: null })
      ]);
      let followers = null, following = null;
      const followStats = Array.isArray(followCountsResult.data) ? followCountsResult.data[0] : followCountsResult.data;
      if (!followCountsResult.error && followStats) {
        followers = Number(followStats.follower_count) || 0;
        following = Number(followStats.following_count) || 0;
      } else if (currentUser && (profile?.is_public === true || currentUser.id === userId)) {
        // Older deployments may not have the aggregate RPC. Never query the
        // follow graph for a private profile; defer metrics until migration setup.
        const [followersResult, followingResult] = await Promise.all([
          client.from("listener_follows").select("*", { count: "exact", head: true }).eq("followed_id", userId),
          client.from("listener_follows").select("*", { count: "exact", head: true }).eq("follower_id", userId)
        ]);
        if (followersResult.error) throw followersResult.error;
        if (followingResult.error) throw followingResult.error;
        followers = followersResult.count || 0;
        following = followingResult.count || 0;
      }
      const name = profile?.display_name || fallbackName || "Listener";
      $("tf-listener-name").textContent = name;
      const isSelf = currentUser && currentUser.id === userId;
      const isPrivateForViewer = !isSelf && (!profile || profile.is_public !== true);
      $("tf-listener-bio").textContent = isPrivateForViewer ? "This listener keeps their profile private." : (profile?.bio || "No public bio yet.");
      let extendedProfile = null;
      try {
        const extended = await client.from("listener_profiles").select("username,location,favorite_genres").eq("user_id", userId).maybeSingle();
        if (!extended.error) extendedProfile = extended.data;
      } catch (_) { /* the profile extension migration may not be installed yet */ }
      renderListenerAvatar(name, profile?.avatar_url, !isPrivateForViewer);
      const profileMeta = [extendedProfile?.username ? "@" + extendedProfile.username : "", extendedProfile?.location || "", Array.isArray(extendedProfile?.favorite_genres) ? extendedProfile.favorite_genres.join(" · ") : ""].filter(Boolean);
      $("tf-listener-profile-meta").textContent = isPrivateForViewer ? "" : profileMeta.join(" · ");
      $("tf-listener-followers").textContent = isPrivateForViewer ? "—" : String(followers ?? "—");
      $("tf-listener-following").textContent = isPrivateForViewer ? "—" : String(following ?? "—");
      $("tf-listener-posts").textContent = isPrivateForViewer ? "—" : String(posts ?? 0);
      const isFollowing = Boolean(followCheck?.data);
      if (isPrivateForViewer) {
        followBtn.textContent = "Private profile";
        followBtn.disabled = true;
      } else if (isSelf) {
        followBtn.textContent = "Your profile";
        followBtn.disabled = true;
      } else if (!currentUser) {
        followBtn.textContent = "Sign in to follow";
        followBtn.disabled = true;
      } else {
        followBtn.disabled = false;
        followBtn.textContent = isFollowing ? "Following ✓" : "＋ Follow";
        followBtn.setAttribute("aria-pressed", String(isFollowing));
        followBtn.onclick = async () => {
          followBtn.disabled = true;
          try {
            if (isFollowing) {
              const { error } = await client.from("listener_follows").delete()
                .eq("follower_id", currentUser.id).eq("followed_id", userId);
              if (error) throw error;
            } else {
              const { error } = await client.from("listener_follows").insert({
                follower_id: currentUser.id, followed_id: userId
              });
              if (error) throw error;
            }
            await openListenerProfile(userId, name);
          } catch (e) {
            $("tf-listener-status").textContent = e.message || "Could not update follow.";
            followBtn.disabled = false;
          }
        };
      }
    } catch (e) {
      $("tf-listener-bio").textContent = "Could not load this profile.";
      $("tf-listener-status").textContent = e.message || "Check Supabase configuration and RLS.";
      followBtn.textContent = "Unavailable";
    }
  }
  async function loadCommunity({ append = false } = {}) {
    if (!client) return;
    if (append && communityLoading) return;
    const requestGeneration = ++communityLoadGeneration;
    const filter = $("tf-feed-filter")?.value || "All topics";
    if (!append) {
      communityOffset = 0;
      communityPostsCache = [];
      communityHasMore = false;
    }
    const start = append ? communityOffset : 0;
    communityLoading = true;
    renderCommunityPagination();
    try {
      let query = client.from("community_posts")
        .select("id,user_id,author_name,category,body,created_at,updated_at")
        .order("created_at", { ascending: false })
        .range(start, start + COMMUNITY_PAGE_SIZE - 1);
      if (filter !== "All topics") query = query.eq("category", filter);
      const { data: pagePosts, error } = await query;
      if (error) throw error;
      if (requestGeneration !== communityLoadGeneration) return;
      const received = pagePosts || [];
      communityPostsCache = append ? communityPostsCache.concat(received) : received;
      communityOffset = start + received.length;
      communityHasMore = received.length === COMMUNITY_PAGE_SIZE;
      const ids = communityPostsCache.map(post => post.id);
      let likes = [], comments = [], saved = new Set(), likeCounts = new Map();
      if (ids.length) {
        const [likeRes, commentRes] = await Promise.all([
          currentUser
            ? client.from("community_post_likes").select("post_id,user_id").eq("user_id", currentUser.id).in("post_id", ids)
            : Promise.resolve({ data: [], error: null }),
          client.from("community_comments").select("id,post_id,user_id,parent_id,body,created_at").in("post_id", ids).order("created_at", { ascending: true }).limit(1000)
        ]);
        if (likeRes.error) throw likeRes.error;
        if (commentRes.error) throw commentRes.error;
        likes = likeRes.data || [];
        comments = commentRes.data || [];
        const chunks = [];
        for (let i = 0; i < ids.length; i += 100) chunks.push(ids.slice(i, i + 100));
        const countResults = await Promise.all(chunks.map(chunk => client.rpc("community_post_like_counts", { p_post_ids: chunk })));
        if (countResults.every(result => !result.error)) {
          ids.forEach(id => likeCounts.set(id, 0));
          countResults.flatMap(result => result.data || []).forEach(row => likeCounts.set(row.post_id, Number(row.like_count) || 0));
        } else {
          // Do not misrepresent the current user's own likes as the global total.
          status("Community loaded; apply the community security migration to enable accurate shared like counts.");
        }
        if (currentUser) {
          const savedRes = await client.from("saved_community_posts").select("post_id").eq("user_id", currentUser.id).in("post_id", ids);
          if (savedRes.error) throw savedRes.error;
          saved = new Set((savedRes.data || []).map(x => x.post_id));
        }
      }
      if (requestGeneration !== communityLoadGeneration) return;
      renderSharedPosts(communityPostsCache, likes, comments, saved, likeCounts);
    } catch (e) {
      if (requestGeneration === communityLoadGeneration) status("Shared community could not load. Check Supabase configuration and RLS: " + (e.message || "network error."));
    } finally {
      if (requestGeneration === communityLoadGeneration) {
        communityLoading = false;
        renderCommunityPagination();
      }
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
    // Keep the shared feed as the community renderer after navigation.
    const localCommunityRenderer = window.tfRenderCommunity;
    window.tfRenderCommunity = function() {
      if (client) { loadCommunity(); return; }
      if (typeof localCommunityRenderer === "function") localCommunityRenderer();
    };
    // Community is public-readable under the supplied RLS policies.
    await loadCommunity();
    try {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      if (data.session) {
        currentUser = data.session.user; renderSignedIn(currentUser);
        try { await loadAccountData(); await ensureOwnProfile(); } catch (e) { status("Signed in, but account sync failed: " + (e.message || "check database setup.")); }
      }
    } catch (e) { status("Could not restore sign-in session: " + (e.message || "try refreshing.")); }
    client.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        currentUser = session.user; renderSignedIn(currentUser);
        // Defer Supabase work outside the auth callback to avoid lock contention.
        setTimeout(async () => {
          try { await loadAccountData(); await ensureOwnProfile(); } catch (e) { status("Account sync failed: " + (e.message || "check database setup.")); }
          await loadCommunity();
        }, 0);
      } else if (event === "SIGNED_OUT") {
        currentUser = null; loadGeneration++; cloudVersions.clear(); renderSignedOut(); loadCommunity();
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
          if (key === "profile") scheduleOwnProfileSync();
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
