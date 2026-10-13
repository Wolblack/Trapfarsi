/* TRAPFARSI Phase 09 — Profile Max + Channel Icon System
 * Rich listener profile, avatar marks from specialized icons,
 * listening identity, badges, channel icon gallery.
 */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const ti = k => (window.tfI18n && window.tfI18n.t) ? window.tfI18n.t(k) : k;

  const AVATAR_KEY = "tf_avatar_mark_v1";
  const avatarMarks = [
    { id: "tf-logo-mark", label: "T. Mark" },
    { id: "tf-logo-wave", label: "Wave" },
    { id: "tf-disc", label: "Disc" },
    { id: "tf-note", label: "Note" },
    { id: "tf-trap", label: "Trap" },
    { id: "tf-persian", label: "Persian" },
    { id: "tf-fire", label: "Fire" },
    { id: "tf-star", label: "Star" },
    { id: "tf-moon", label: "Moon" },
    { id: "tf-heart", label: "Heart" },
    { id: "tf-badge", label: "Badge" },
    { id: "tf-globe", label: "Globe" }
  ];

  const channelIcons = [
    ["tf-logo-mark", "Logo mark"],
    ["tf-logo-wave", "Wave logo"],
    ["tf-play", "Play"],
    ["tf-pause", "Pause"],
    ["tf-next", "Next"],
    ["tf-prev", "Previous"],
    ["tf-shuffle", "Shuffle"],
    ["tf-repeat", "Repeat"],
    ["tf-lyrics", "Lyrics"],
    ["tf-discuss", "Discussion"],
    ["tf-library", "Library"],
    ["tf-search", "Search"],
    ["tf-profile", "Profile"],
    ["tf-heart", "Like"],
    ["tf-star", "Favorite"],
    ["tf-fire", "Hot"],
    ["tf-moon", "Night"],
    ["tf-globe", "Language"],
    ["tf-badge", "Achievement"],
    ["tf-persian", "Persian Trap"],
    ["tf-trap", "Trap bars"],
    ["tf-share", "Share"],
    ["tf-queue", "Queue"],
    ["tf-note", "Music note"],
    ["tf-disc", "Disc"]
  ];

  function injectStyles() {
    if ($("tf-phase09-style")) return;
    const s = document.createElement("style");
    s.id = "tf-phase09-style";
    s.textContent = `
.tf-profile-hero{
  display:grid;grid-template-columns:auto 1fr;gap:22px;align-items:center;
  padding:24px;border-radius:28px;margin-bottom:18px;
  background:rgba(255,255,255,.62);border:1px solid rgba(255,255,255,.9);
  box-shadow:0 16px 40px rgba(40,50,70,.07), inset 0 1px 0 #fff;
}
html.tf-night .tf-profile-hero{background:rgba(28,32,40,.78);border-color:rgba(255,255,255,.1);box-shadow:0 16px 40px rgba(0,0,0,.3)}
.tf-avatar-stage{
  width:108px;height:108px;border-radius:32px;display:grid;place-items:center;position:relative;
  background:linear-gradient(145deg,#fff,#e4e8ef);
  box-shadow:10px 12px 24px #b8c0cc44,-8px -8px 20px #fff, inset 1px 1px 0 #fff;
}
html.tf-night .tf-avatar-stage{background:linear-gradient(145deg,#2a303c,#1a1f28);box-shadow:8px 10px 24px rgba(0,0,0,.4)}
.tf-avatar-stage svg,.tf-avatar-stage .tf-avatar-letter{
  width:64px;height:64px;color:#1c212b;
}
html.tf-night .tf-avatar-stage svg{color:#eef1f6}
.tf-avatar-stage .tf-avatar-letter{
  display:grid;place-items:center;font:800 36px/1 Manrope,sans-serif;letter-spacing:-1px;
}
.tf-profile-hero-copy h2{margin:0 0 6px;font:800 clamp(26px,4vw,36px)/1.1 Manrope,sans-serif;letter-spacing:-1px}
.tf-profile-hero-copy p{margin:0;color:#7a8190;font-size:13px;line-height:1.6;max-width:420px}
.tf-profile-stats{display:flex;flex-wrap:wrap;gap:18px;margin-top:14px}
.tf-profile-stats div strong{display:block;font:750 18px Manrope,sans-serif}
.tf-profile-stats div span{font-size:10px;color:#8a909b;letter-spacing:.04em}
.tf-avatar-picker{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin:12px 0 4px}
.tf-avatar-opt{
  aspect-ratio:1;border-radius:16px;border:1px solid rgba(255,255,255,.85);
  background:rgba(255,255,255,.55);display:grid;place-items:center;cursor:pointer;color:#2a303c;
  transition:transform .15s,box-shadow .15s,background .15s;
}
.tf-avatar-opt:hover{transform:translateY(-2px);background:#fff}
.tf-avatar-opt.active{box-shadow:inset 0 0 0 2px #2a303c;background:#fff}
.tf-avatar-opt svg{width:28px;height:28px}
html.tf-night .tf-avatar-opt{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12);color:#eef1f6}
html.tf-night .tf-avatar-opt.active{box-shadow:inset 0 0 0 2px #eef1f6}
.tf-badge-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.tf-chip-badge{
  display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:999px;
  font-size:11px;font-weight:700;border:1px solid rgba(255,255,255,.85);
  background:rgba(255,255,255,.7);color:#3a4150;
}
.tf-chip-badge svg{width:14px;height:14px}
.tf-chip-badge.off{opacity:.4;filter:grayscale(.8)}
html.tf-night .tf-chip-badge{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12);color:#c5cbd6}
.tf-icon-gallery{
  margin-top:22px;padding:22px;border-radius:24px;
  background:rgba(255,255,255,.55);border:1px solid rgba(255,255,255,.9);
  box-shadow:0 12px 32px rgba(40,50,70,.06);
}
html.tf-night .tf-icon-gallery{background:rgba(28,32,40,.75);border-color:rgba(255,255,255,.1)}
.tf-icon-gallery h3{margin:0 0 6px;font:750 18px Manrope,sans-serif}
.tf-icon-gallery > p{margin:0 0 16px;font-size:12px;color:#7a8190}
.tf-icon-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:10px}
.tf-icon-card{
  display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px 8px;
  border-radius:18px;border:1px solid rgba(255,255,255,.8);background:rgba(255,255,255,.65);
  color:#2a303c;font-size:10px;font-weight:650;text-align:center;
}
.tf-icon-card svg{width:32px;height:32px}
html.tf-night .tf-icon-card{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.1);color:#c5cbd6}
.tf-profile-layout-max{display:grid;gap:16px}
@media(min-width:900px){
  .tf-profile-layout-max{grid-template-columns:1.1fr .9fr}
  .tf-icon-gallery{grid-column:1/-1}
}
.tf-identity-fields{display:grid;gap:10px}
.tf-listening-now-card{
  display:flex;gap:12px;align-items:center;padding:14px;border-radius:18px;margin-top:12px;
  background:rgba(255,255,255,.55);border:1px solid rgba(255,255,255,.85);
}
html.tf-night .tf-listening-now-card{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.1)}
.tf-listening-now-card img{width:48px;height:48px;border-radius:12px;object-fit:cover;background:#e8eaef}
.tf-listening-now-card strong{display:block;font-size:13px}
.tf-listening-now-card span{font-size:11px;color:#8a909b}
.profile-avatar{display:none !important} /* replaced by hero */
`;
    document.head.appendChild(s);
  }

  function iconSvg(symbolId, size) {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 64 64");
    if (size) {
      svg.setAttribute("width", size);
      svg.setAttribute("height", size);
    }
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS(ns, "use");
    // Inline fallback paths for when external sprite CORS blocks <use>
    use.setAttributeNS("http://www.w3.org/1999/xlink", "href", `./icons/trapfarsi-icons.svg#${symbolId}`);
    use.setAttribute("href", `./icons/trapfarsi-icons.svg#${symbolId}`);
    svg.appendChild(use);
    return svg;
  }

  // Inline icon paths so avatars work without sprite fetch issues
  const inlinePaths = {
    "tf-disc": '<circle cx="32" cy="32" r="26" stroke="currentColor" stroke-width="2.5" fill="none"/><circle cx="32" cy="32" r="8" stroke="currentColor" stroke-width="2.5" fill="none"/><circle cx="32" cy="32" r="2.5" fill="currentColor"/>',
    "tf-note": '<path d="M24 48a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" stroke="currentColor" stroke-width="2.5" fill="none"/><path d="M32 40V12l20-4v20" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M52 28a7 7 0 1 1-14 0" stroke="currentColor" stroke-width="2.5" fill="none"/>',
    "tf-trap": '<path d="M12 44V24l10 8 10-16 10 16 10-8v20H12z" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linejoin="round"/><path d="M20 44v-6M32 44v-10M44 44v-6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
    "tf-persian": '<rect x="8" y="14" width="48" height="36" rx="8" stroke="currentColor" stroke-width="2.5" fill="none"/><path d="M18 36c4-10 10-12 14-4s8 8 14 2" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
    "tf-fire": '<path d="M32 8c4 12-8 16-8 28a12 12 0 0 0 24 0c0-10-6-14-4-24-6 6-8 10-12-4z" stroke="currentColor" stroke-width="2.5" fill="none"/>',
    "tf-star": '<path d="M32 8l6.5 18.5H58l-15 11 5.8 18.5L32 45l-16.8 11 5.8-18.5-15-11h19.5L32 8z" stroke="currentColor" stroke-width="2.5" fill="none"/>',
    "tf-moon": '<path d="M40 12a22 22 0 1 0 12 28A18 18 0 0 1 40 12z" stroke="currentColor" stroke-width="2.5" fill="none"/>',
    "tf-heart": '<path d="M32 52S10 38 10 24a12 12 0 0 1 22-6 12 12 0 0 1 22 6c0 14-22 28-22 28z" stroke="currentColor" stroke-width="2.5" fill="none"/>',
    "tf-badge": '<path d="M32 6l8 6 10-1 3 10 9 5-5 9 1 10-10 3-6 8-9-5-10 1-3-10-9-5 5-9-1-10 10-3 6-8z" stroke="currentColor" stroke-width="2.2" fill="none"/><circle cx="32" cy="32" r="10" stroke="currentColor" stroke-width="2.2" fill="none"/>',
    "tf-globe": '<circle cx="32" cy="32" r="22" stroke="currentColor" stroke-width="2.5" fill="none"/><path d="M10 32h44M32 10c8 8 8 36 0 44M32 10c-8 8-8 36 0 44" stroke="currentColor" stroke-width="2.2" fill="none"/>',
    "tf-logo-mark": '<rect width="64" height="64" rx="18" fill="currentColor" opacity=".12"/><text x="32" y="42" text-anchor="middle" font-family="Manrope,Arial,sans-serif" font-weight="800" font-size="26" fill="currentColor">T.</text>',
    "tf-logo-wave": '<path d="M8 34c4-10 8-10 12 0s8 10 12 0 8-10 12 0 8 10 12 0" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="32" cy="18" r="4" fill="currentColor"/>',
    "tf-play": '<circle cx="32" cy="32" r="26" stroke="currentColor" stroke-width="2.5" fill="none"/><path d="M26 20l22 12-22 12z" fill="currentColor"/>',
    "tf-pause": '<circle cx="32" cy="32" r="26" stroke="currentColor" stroke-width="2.5" fill="none"/><rect x="22" y="20" width="7" height="24" rx="2" fill="currentColor"/><rect x="35" y="20" width="7" height="24" rx="2" fill="currentColor"/>',
    "tf-next": '<path d="M14 16l24 16-24 16z" fill="currentColor"/><rect x="42" y="16" width="6" height="32" rx="2" fill="currentColor"/>',
    "tf-prev": '<path d="M50 16L26 32l24 16z" fill="currentColor"/><rect x="16" y="16" width="6" height="32" rx="2" fill="currentColor"/>',
    "tf-shuffle": '<path d="M8 20h14l24 24h10M8 44h14l8-8" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M46 16l10 4-4 10M46 48l10-4-4-10" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/>',
    "tf-repeat": '<path d="M14 28V20h36v12M50 36v8H14V32" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/>',
    "tf-lyrics": '<rect x="12" y="10" width="40" height="44" rx="6" stroke="currentColor" stroke-width="2.5" fill="none"/><path d="M20 22h24M20 32h24M20 42h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
    "tf-discuss": '<path d="M12 18h40v28H28l-10 8v-8H12z" stroke="currentColor" stroke-width="2.5" fill="none"/><path d="M22 28h20M22 36h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
    "tf-library": '<rect x="10" y="12" width="14" height="40" rx="3" stroke="currentColor" stroke-width="2.5" fill="none"/><rect x="28" y="12" width="14" height="40" rx="3" stroke="currentColor" stroke-width="2.5" fill="none"/><rect x="46" y="12" width="8" height="40" rx="3" stroke="currentColor" stroke-width="2.5" fill="none"/>',
    "tf-search": '<circle cx="28" cy="28" r="14" stroke="currentColor" stroke-width="3" fill="none"/><path d="M39 39l14 14" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    "tf-profile": '<circle cx="32" cy="24" r="12" stroke="currentColor" stroke-width="2.5" fill="none"/><path d="M12 54c4-12 12-18 20-18s16 6 20 18" stroke="currentColor" stroke-width="2.5" fill="none"/>',
    "tf-share": '<circle cx="14" cy="32" r="8" stroke="currentColor" stroke-width="2.5" fill="none"/><circle cx="50" cy="16" r="8" stroke="currentColor" stroke-width="2.5" fill="none"/><circle cx="50" cy="48" r="8" stroke="currentColor" stroke-width="2.5" fill="none"/><path d="M21 28l22-10M21 36l22 10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
    "tf-queue": '<path d="M12 16h40M12 32h40M12 48h28" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M48 42l8 6-8 6z" fill="currentColor"/>'
  };

  function makeIcon(symbolId, size) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 64 64");
    svg.setAttribute("width", size || 28);
    svg.setAttribute("height", size || 28);
    svg.setAttribute("fill", "none");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = inlinePaths[symbolId] || inlinePaths["tf-note"];
    return svg;
  }

  function getProfile() {
    try {
      return JSON.parse(localStorage.getItem("tf_profile_v1") || "{}") || {};
    } catch (_) { return {}; }
  }

  function stats() {
    try {
      return JSON.parse(localStorage.getItem("tf_stats_v1") || localStorage.getItem("tf_feature_stats") || "{}") || {};
    } catch (_) { return {}; }
  }

  function featureStats() {
    // Compatible with phase feature keys used in index
    try {
      const raw = localStorage.getItem("tf_stats_v1");
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    // try alternate keys from listener hub
    for (const k of Object.keys(localStorage)) {
      if (k.includes("stats") && k.startsWith("tf")) {
        try {
          const v = JSON.parse(localStorage.getItem(k));
          if (v && (v.plays != null || v.seconds != null)) return v;
        } catch (_) {}
      }
    }
    return { plays: 0, seconds: 0 };
  }

  function earnedBadges() {
    const st = featureStats();
    const plays = st.plays || 0;
    const seconds = st.seconds || 0;
    let fav = [];
    try { fav = JSON.parse(localStorage.getItem("tf_favorites") || "[]"); } catch (_) {}
    // also scan feature keys
    try {
      for (const k of Object.keys(localStorage)) {
        if (k.includes("favorite")) {
          const v = JSON.parse(localStorage.getItem(k) || "[]");
          if (Array.isArray(v) && v.length) fav = v;
        }
      }
    } catch (_) {}
    return [
      { id: "tf-play", label: "First play", on: plays >= 1 },
      { id: "tf-fire", label: "On fire", on: plays >= 10 },
      { id: "tf-star", label: "Collector", on: (fav.length || 0) >= 3 },
      { id: "tf-lyrics", label: "Lyricist", on: (() => {
        try {
          const notes = JSON.parse(localStorage.getItem("tf_lyrics_notes_v1") || "{}");
          return Object.keys(notes).length > 0;
        } catch (_) { return false; }
      })() },
      { id: "tf-discuss", label: "Voice", on: (() => {
        try {
          const posts = JSON.parse(localStorage.getItem("tf_community_posts_v1") || "[]");
          return Array.isArray(posts) && posts.length > 0;
        } catch (_) { return false; }
      })() },
      { id: "tf-moon", label: "Night owl", on: seconds >= 600 },
      { id: "tf-globe", label: "Polyglot", on: !!localStorage.getItem("tf_lang_v1") },
      { id: "tf-badge", label: "Identity", on: !!(getProfile().name && getProfile().name !== "Listener") }
    ];
  }

  function enhanceProfilePage() {
    const page = document.querySelector('[data-page="profile"]');
    if (!page || page.dataset.phase09) return;
    page.dataset.phase09 = "1";

    const layout = page.querySelector(".profile-layout");
    if (!layout) return;

    // Hero
    const hero = el("section", "tf-profile-hero glass");
    hero.id = "tf-profile-hero";
    hero.innerHTML = `
      <div class="tf-avatar-stage" id="tf-avatar-stage"></div>
      <div class="tf-profile-hero-copy">
        <h2 id="tf-hero-name">Listener</h2>
        <p id="tf-hero-bio">Your listening identity on TRAPFARSI.</p>
        <div class="tf-profile-stats">
          <div><strong id="tf-stat-plays">0</strong><span>PLAYS</span></div>
          <div><strong id="tf-stat-time">0h</strong><span>LISTEN TIME</span></div>
          <div><strong id="tf-stat-lists">0</strong><span>PLAYLISTS</span></div>
        </div>
        <div class="tf-badge-row" id="tf-badge-row"></div>
        <div class="tf-listening-now-card" id="tf-listening-card">
          <img id="tf-listening-art" alt="">
          <div><strong id="tf-listening-title">Nothing playing</strong><span id="tf-listening-sub">Start a track to pin it here</span></div>
        </div>
      </div>`;
    layout.parentElement.insertBefore(hero, layout);

    // Avatar picker inside profile card
    const card = page.querySelector(".profile-card");
    if (card) {
      const pickerLabel = el("div", "field-label", "AVATAR MARK");
      const picker = el("div", "tf-avatar-picker");
      picker.id = "tf-avatar-picker";
      avatarMarks.forEach(m => {
        const btn = el("button", "tf-avatar-opt");
        btn.type = "button";
        btn.dataset.mark = m.id;
        btn.title = m.label;
        btn.appendChild(makeIcon(m.id, 26));
        btn.addEventListener("click", () => {
          localStorage.setItem(AVATAR_KEY, m.id);
          renderAvatar();
          picker.querySelectorAll(".tf-avatar-opt").forEach(b => b.classList.toggle("active", b.dataset.mark === m.id));
        });
        picker.appendChild(btn);
      });
      const saveBtn = $("tf-profile-save");
      if (saveBtn) {
        card.insertBefore(pickerLabel, saveBtn);
        card.insertBefore(picker, saveBtn);
      } else {
        card.append(pickerLabel, picker);
      }
    }

    // Icon gallery for the channel
    const gallery = el("section", "tf-icon-gallery");
    gallery.innerHTML = `<h3>TRAPFARSI channel icons</h3><p>Specialized monoline set for the platform — player, discussion, Persian trap, and brand marks. Use in the app, Telegram, or social.</p>`;
    const grid = el("div", "tf-icon-grid");
    channelIcons.forEach(([id, label]) => {
      const cardI = el("div", "tf-icon-card");
      cardI.appendChild(makeIcon(id, 32));
      cardI.appendChild(document.createTextNode(label));
      grid.appendChild(cardI);
    });
    gallery.appendChild(grid);
    // brand file links
    const links = el("p", "");
    links.style.marginTop = "14px";
    links.style.fontSize = "12px";
    links.innerHTML = `Brand files: <a href="./icons/logo-app.svg" download>logo-app.svg</a> · <a href="./icons/logo-mark.svg" download>logo-mark.svg</a> · <a href="./icons/trapfarsi-icons.svg" download>full sprite</a>`;
    gallery.appendChild(links);
    layout.parentElement.appendChild(gallery);

    // Wrap existing layout
    layout.classList.add("tf-profile-layout-max");

    // Hook save to refresh hero
    $("tf-profile-save")?.addEventListener("click", () => setTimeout(refreshHero, 50));

    refreshHero();
    renderAvatar();
    const current = localStorage.getItem(AVATAR_KEY) || "tf-logo-mark";
    document.querySelectorAll("#tf-avatar-picker .tf-avatar-opt").forEach(b => {
      b.classList.toggle("active", b.dataset.mark === current);
    });
  }

  function renderAvatar() {
    const stage = $("tf-avatar-stage");
    if (!stage) return;
    stage.replaceChildren();
    const mark = localStorage.getItem(AVATAR_KEY);
    if (mark && inlinePaths[mark]) {
      stage.appendChild(makeIcon(mark, 56));
    } else {
      const letter = el("div", "tf-avatar-letter");
      const name = getProfile().name || "Listener";
      letter.textContent = String(name).trim().slice(0, 1).toUpperCase() || "T";
      stage.appendChild(letter);
    }
  }

  function refreshHero() {
    const p = getProfile();
    if ($("tf-hero-name")) $("tf-hero-name").textContent = p.name || "Listener";
    if ($("tf-hero-bio")) $("tf-hero-bio").textContent = p.bio || "Your listening identity on TRAPFARSI.";
    const st = featureStats();
    if ($("tf-stat-plays")) $("tf-stat-plays").textContent = String(st.plays || 0);
    if ($("tf-stat-time")) {
      const sec = st.seconds || 0;
      $("tf-stat-time").textContent = Math.floor(sec / 3600) + "h " + String(Math.floor((sec % 3600) / 60)).padStart(2, "0") + "m";
    }
    let lists = 0;
    try {
      const pl = JSON.parse(localStorage.getItem("tf_playlists_v1") || "[]");
      lists = Array.isArray(pl) ? pl.length : 0;
    } catch (_) {}
    if ($("tf-stat-lists")) $("tf-stat-lists").textContent = String(lists);

    const row = $("tf-badge-row");
    if (row) {
      row.replaceChildren();
      earnedBadges().forEach(b => {
        const chip = el("span", "tf-chip-badge" + (b.on ? "" : " off"));
        chip.appendChild(makeIcon(b.id, 14));
        chip.appendChild(document.createTextNode(b.label));
        row.appendChild(chip);
      });
    }

    const player = window.tfPlayer;
    const track = player?.queue?.[player.trackIndex];
    const album = player?.album || {};
    if ($("tf-listening-title")) $("tf-listening-title").textContent = track?.title || "Nothing playing";
    if ($("tf-listening-sub")) {
      $("tf-listening-sub").textContent = track
        ? (window.tfLocalMode ? "Local audio" : album.artist || "TRAPFARSI")
        : "Start a track to pin it here";
    }
    if ($("tf-listening-art") && album.art) $("tf-listening-art").src = album.art;
    renderAvatar();
  }

  function updateFooter() {
    const foot = document.querySelector(".footer span:last-child");
    if (foot) foot.innerHTML = `PHASE 09 / PROFILE & ICONS <span class="tf-phase-badge">CHANNEL SET</span>`;
  }

  function patchRenderProfile() {
    const prev = window.tfRenderProfile;
    window.tfRenderProfile = function () {
      if (typeof prev === "function") prev.apply(this, arguments);
      refreshHero();
    };
  }

  function init() {
    injectStyles();
    enhanceProfilePage();
    patchRenderProfile();
    updateFooter();
    // refresh when player updates
    const prev = window.tfRenderPlayer;
    if (typeof prev === "function") {
      window.tfRenderPlayer = function () {
        prev.apply(this, arguments);
        if (location.hash.replace(/^#/, "") === "profile") refreshHero();
      };
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
