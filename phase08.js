/* TRAPFARSI Phase 08 — "Best one ever"
 * Night glass theme · Shuffle/Repeat · Lyric seek · Share to discussion ·
 * Keyboard shortcuts · Ambient art glow · Stage queue · Presence strip
 */
(() => {
  "use strict";
  const THEME_KEY = "tf_theme_v1";
  const SHUFFLE_KEY = "tf_shuffle_v1";
  const REPEAT_KEY = "tf_repeat_v1"; // off | one | all

  const $ = id => document.getElementById(id);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  let shuffle = localStorage.getItem(SHUFFLE_KEY) === "1";
  let repeat = localStorage.getItem(REPEAT_KEY) || "off";
  let theme = localStorage.getItem(THEME_KEY) || "light";
  let orderBag = null; // for shuffle restore

  function injectStyles() {
    if ($("tf-phase08-style")) return;
    const s = document.createElement("style");
    s.id = "tf-phase08-style";
    s.textContent = `
/* ── Night glass ── */
html.tf-night{
  color-scheme:dark;
  --bg:#0e1116;--ink:#f2f4f7;--muted:#9aa3b2;--glass:rgba(28,32,40,.72);--line:rgba(255,255,255,.1);
  --shadow-card:0 18px 50px rgba(0,0,0,.35);--shadow-in:inset 0 1px 0 rgba(255,255,255,.08);
}
html.tf-night body{
  background:
    radial-gradient(ellipse at 12% 0%,rgba(80,100,140,.22) 0,transparent 40%),
    radial-gradient(ellipse at 90% 20%,rgba(60,40,90,.18) 0,transparent 38%),
    #0e1116 !important;
  color:#f2f4f7;
}
html.tf-night .glass,
html.tf-night .tf-dock,
html.tf-night .tf-compact,
html.tf-night .tf-stage,
html.tf-night .tf-lyrics-stage,
html.tf-night .tf-discuss-banner,
html.tf-night .community-post,
html.tf-night .topbar{
  background:rgba(28,32,40,.78) !important;
  border-color:rgba(255,255,255,.12) !important;
  box-shadow:0 16px 40px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.06) !important;
  color:#eef1f6;
}
html.tf-night .nav-link{color:#9aa3b2}
html.tf-night .nav-link.active,html.tf-night .nav-link:hover{color:#fff;background:rgba(255,255,255,.08)}
html.tf-night .tf-dock-btn{
  background:linear-gradient(145deg,#2a303c,#1a1f28);color:#eef1f6;border-color:rgba(255,255,255,.12);
  box-shadow:4px 4px 12px rgba(0,0,0,.35),-2px -2px 8px rgba(255,255,255,.04);
}
html.tf-night .tf-dock-btn.primary{background:linear-gradient(145deg,#f4f6f9,#d8dde6);color:#12151a}
html.tf-night .tf-lyric-line{color:#6b7382}
html.tf-night .tf-lyric-line.active{color:#fff;background:rgba(255,255,255,.08)}
html.tf-night .tf-lyric-line.near{color:#aeb6c4}
html.tf-night .community-input,html.tf-night textarea,html.tf-night select,html.tf-night input{
  background:rgba(18,22,28,.85) !important;color:#eef1f6 !important;border-color:rgba(255,255,255,.12) !important;
}
html.tf-night .footer{color:#7a8494}
html.tf-night .album-card,html.tf-night .release-card,html.tf-night .artist-card{
  background:rgba(28,32,40,.6);border-color:rgba(255,255,255,.08);
}

/* Ambient glow behind stage art */
.tf-ambient-glow{
  position:absolute;inset:8% 12% auto;height:42%;border-radius:50%;
  filter:blur(48px);opacity:.45;pointer-events:none;z-index:0;
  background:radial-gradient(circle,var(--tf-ambient,#6b7c9a),transparent 70%);
  transition:background .8s ease;
}
.tf-stage{position:relative}
.tf-stage > *:not(.tf-ambient-glow){position:relative;z-index:1}

/* Transport extras */
.tf-transport-extra{display:flex;gap:6px;align-items:center}
.tf-transport-extra button{
  width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,.85);
  background:rgba(255,255,255,.55);font-size:11px;font-weight:750;cursor:pointer;color:#3a4150;
}
html.tf-night .tf-transport-extra button{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12);color:#c5cbd6}
.tf-transport-extra button.on{background:#2a303c;color:#fff;border-color:#2a303c}
html.tf-night .tf-transport-extra button.on{background:#eef1f6;color:#12151a}

/* Theme toggle in topbar */
.tf-theme-toggle{
  width:42px;height:42px;border-radius:15px;border:1px solid #ffffffc9;background:#ffffff85;
  box-shadow:3px 3px 9px #c6ccd533,-3px -3px 9px #fff8;cursor:pointer;font-size:16px;
  display:grid;place-items:center;
}
html.tf-night .tf-theme-toggle{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12);color:#eef1f6;box-shadow:none}

/* Stage queue */
.tf-stage-queue{margin-top:16px;max-height:160px;overflow:auto;border-top:1px solid rgba(120,130,150,.2);padding-top:12px}
.tf-stage-queue h4{margin:0 0 8px;font-size:11px;letter-spacing:.08em;color:#8a909b}
.tf-sq-row{display:flex;align-items:center;gap:10px;padding:8px 6px;border-radius:12px;cursor:pointer;font-size:12px}
.tf-sq-row:hover{background:rgba(255,255,255,.45)}
html.tf-night .tf-sq-row:hover{background:rgba(255,255,255,.06)}
.tf-sq-row.active{font-weight:750;background:rgba(255,255,255,.55)}
html.tf-night .tf-sq-row.active{background:rgba(255,255,255,.1)}
.tf-sq-row span{color:#8a909b;font-size:10px;margin-left:auto}

/* Share / shortcuts chip */
.tf-hotkeys-hint{
  position:fixed;bottom:100px;right:16px;z-index:35;padding:10px 14px;border-radius:14px;
  background:rgba(255,255,255,.88);border:1px solid rgba(255,255,255,.9);font-size:11px;color:#5c6472;
  box-shadow:0 10px 30px rgba(30,40,60,.12);opacity:0;pointer-events:none;transition:opacity .3s;
}
.tf-hotkeys-hint.show{opacity:1}
html.tf-night .tf-hotkeys-hint{background:rgba(28,32,40,.92);color:#c5cbd6;border-color:rgba(255,255,255,.1)}

/* Presence on community */
.tf-presence{
  display:flex;align-items:center;gap:12px;padding:12px 14px;margin:0 0 14px;border-radius:16px;
  background:linear-gradient(135deg,rgba(255,255,255,.7),rgba(236,242,255,.75));
  border:1px solid rgba(255,255,255,.9);font-size:12px;
}
html.tf-night .tf-presence{background:rgba(40,50,70,.45);border-color:rgba(255,255,255,.1)}
.tf-presence img{width:36px;height:36px;border-radius:10px;object-fit:cover}
.tf-presence strong{display:block;font-size:12px}
.tf-presence span{color:#7a8190;font-size:11px}
.tf-presence button{margin-left:auto;border:0;border-radius:999px;padding:8px 12px;font-size:11px;font-weight:750;cursor:pointer;background:#2a303c;color:#fff}

/* Lyric lines clickable */
.tf-lyric-line{cursor:pointer}
.tf-lyric-line:hover{color:#3a4150}
html.tf-night .tf-lyric-line:hover{color:#d5dae3}

/* Home discovery strip */
.tf-mood-strip{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0 8px}
.tf-mood-chip{
  border:1px solid #ffffffd0;background:#ffffffa0;border-radius:999px;padding:10px 14px;
  font-size:11px;font-weight:700;cursor:pointer;color:#4a5160;transition:transform .15s,background .15s;
}
.tf-mood-chip:hover{transform:translateY(-1px);background:#fff}
html.tf-night .tf-mood-chip{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12);color:#c5cbd6}
html.tf-night .tf-mood-chip:hover{background:rgba(255,255,255,.12)}

/* Phase badge */
.tf-phase-badge{
  display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;
  font-size:10px;font-weight:750;letter-spacing:.06em;background:#ffffffa8;border:1px solid #ffffffd0;color:#5c6472;
}
html.tf-night .tf-phase-badge{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.12);color:#aeb6c4}
`;
    document.head.appendChild(s);
  }

  function applyTheme() {
    document.documentElement.classList.toggle("tf-night", theme === "night");
    const btn = $("tf-theme-toggle");
    if (btn) {
      btn.textContent = theme === "night" ? "☀" : "☾";
      btn.title = theme === "night" ? "Light mode" : "Night glass";
      btn.setAttribute("aria-label", btn.title);
    }
  }

  function mountThemeToggle() {
    const actions = document.querySelector(".top-actions");
    if (!actions || $("tf-theme-toggle")) return;
    const btn = el("button", "tf-theme-toggle");
    btn.id = "tf-theme-toggle";
    btn.type = "button";
    btn.addEventListener("click", () => {
      theme = theme === "night" ? "light" : "night";
      localStorage.setItem(THEME_KEY, theme);
      applyTheme();
    });
    actions.prepend(btn);
    applyTheme();
  }

  function updateTransportButtons() {
    document.querySelectorAll("[data-tf-shuffle]").forEach(b => {
      b.classList.toggle("on", shuffle);
      b.title = shuffle ? "Shuffle on" : "Shuffle off";
      b.setAttribute("aria-pressed", String(shuffle));
    });
    document.querySelectorAll("[data-tf-repeat]").forEach(b => {
      b.classList.toggle("on", repeat !== "off");
      b.textContent = repeat === "one" ? "①" : "↻";
      b.title = repeat === "off" ? "Repeat off" : repeat === "one" ? "Repeat one" : "Repeat all";
      b.setAttribute("aria-pressed", String(repeat !== "off"));
    });
  }

  function mountTransportExtras() {
    const targets = [
      document.querySelector("#tf-dock .tf-dock-controls"),
      document.querySelector("#tf-stage .tf-stage-controls")
    ].filter(Boolean);
    targets.forEach((wrap, i) => {
      if (wrap.querySelector(".tf-transport-extra")) return;
      const box = el("div", "tf-transport-extra");
      box.innerHTML = `
        <button type="button" data-tf-shuffle title="Shuffle">⇄</button>
        <button type="button" data-tf-repeat title="Repeat">↻</button>
        <button type="button" data-tf-share title="Share to discussion">↗</button>`;
      wrap.appendChild(box);
    });
    updateTransportButtons();
  }

  function nextIndex(delta) {
    const p = window.tfPlayer;
    if (!p?.queue?.length) return 0;
    const n = p.queue.length;
    if (shuffle && delta !== 0) {
      if (n === 1) return 0;
      let i;
      do { i = Math.floor(Math.random() * n); } while (i === p.trackIndex);
      return i;
    }
    return (p.trackIndex + delta + n) % n;
  }

  function playAt(i) {
    if (typeof window.tfLocalMode !== "undefined" && window.tfLocalMode && typeof window.tfPlayLocalTrack === "function") {
      window.tfPlayLocalTrack(i);
    } else if (typeof window.tfPlayTrack === "function") {
      window.tfPlayTrack(i);
    }
  }

  function wireEndBehavior() {
    // Intercept auto-advance when track ends (demo timer path)
    const prevRender = window.tfRenderPlayer;
    if (typeof prevRender !== "function" || prevRender.__tfPhase08) return;
    // Hook play next via click interception is already handled; patch interval behavior lightly
    const origPlayTrack = window.tfPlayTrack;
    if (typeof origPlayTrack === "function" && !origPlayTrack.__tfPhase08) {
      window.tfPlayTrack = function (i) {
        if (arguments.length === 0) i = nextIndex(1);
        return origPlayTrack.call(this, i);
      };
      window.tfPlayTrack.__tfPhase08 = true;
    }
  }

  function onShareNowPlaying() {
    const p = window.tfPlayer;
    const track = p?.queue?.[p.trackIndex];
    const album = p?.album || {};
    const title = track?.title || "a track";
    const artist = window.tfLocalMode ? "Local audio" : (album.artist || "TRAPFARSI");
    const ti = (window.tfI18n && window.tfI18n.t) ? window.tfI18n.t : (k => k);
    const text = `${ti("listening_to")} “${title}” — ${artist}. ${ti("what_rotation")}`;
    location.hash = "community";
    setTimeout(() => {
      const input = $("tf-post-text");
      const cat = $("tf-post-category");
      if (cat) cat.value = "Music Talk";
      if (input) {
        input.value = text.slice(0, 600);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.focus();
        input.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      if (typeof window.toast === "function") window.toast((window.tfI18n && window.tfI18n.t) ? window.tfI18n.t("draft_ready") : "Draft ready — publish to the public room.");
    }, 120);
  }

  function bindGlobalClicks() {
    document.addEventListener("click", e => {
      if (e.target.closest("[data-tf-shuffle]")) {
        shuffle = !shuffle;
        localStorage.setItem(SHUFFLE_KEY, shuffle ? "1" : "0");
        updateTransportButtons();
        return;
      }
      if (e.target.closest("[data-tf-repeat]")) {
        repeat = repeat === "off" ? "all" : repeat === "all" ? "one" : "off";
        localStorage.setItem(REPEAT_KEY, repeat);
        updateTransportButtons();
        return;
      }
      if (e.target.closest("[data-tf-share]")) {
        onShareNowPlaying();
        return;
      }
      const line = e.target.closest(".tf-lyric-line");
      if (line && line.dataset.i != null) {
        const p = window.tfPlayer;
        if (!p) return;
        const lines = document.querySelectorAll("#tf-lx-lines .tf-lyric-line");
        const idx = Number(line.dataset.i);
        const dur = p.duration || 180;
        const target = Math.floor((idx / Math.max(1, lines.length)) * dur);
        p.seconds = target;
        if (window.tfLocalAudio && !window.tfLocalAudio.paused) {
          try { window.tfLocalAudio.currentTime = target; } catch (_) {}
        }
        const seek = $("np-seek");
        if (seek) {
          seek.value = target;
          seek.dispatchEvent(new Event("input", { bubbles: true }));
        }
        if (typeof window.tfRenderPlayer === "function") window.tfRenderPlayer();
      }
    });
  }

  function bindKeyboard() {
    document.addEventListener("keydown", e => {
      const tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target?.isContentEditable) return;
      const p = window.tfPlayer;
      if (e.code === "Space") {
        e.preventDefault();
        document.querySelector('[data-player="toggle"]')?.click();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        playAt(nextIndex(1));
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        if (p && p.seconds > 3) {
          p.seconds = 0;
          if (window.tfLocalAudio) try { window.tfLocalAudio.currentTime = 0; } catch (_) {}
          if (typeof window.tfRenderPlayer === "function") window.tfRenderPlayer();
        } else playAt(nextIndex(-1));
      } else if (e.key === "l" || e.key === "L") {
        location.hash = "lyrics";
      } else if (e.key === "c" || e.key === "C") {
        location.hash = "community";
      } else if (e.key === "n" || e.key === "N") {
        theme = theme === "night" ? "light" : "night";
        localStorage.setItem(THEME_KEY, theme);
        applyTheme();
      } else if (e.key === "?") {
        showHotkeys();
      }
    });
  }

  function showHotkeys() {
    let hint = $("tf-hotkeys-hint");
    if (!hint) {
      hint = el("div", "tf-hotkeys-hint");
      hint.id = "tf-hotkeys-hint";
      const ti = (window.tfI18n && window.tfI18n.t) ? window.tfI18n.t : (k => k);
      hint.innerHTML = "<strong>" + ti("hotkeys") + "</strong><br>" + ti("hotkeys_body");
      document.body.appendChild(hint);
    }
    hint.classList.add("show");
    clearTimeout(window._tfHintTimer);
    window._tfHintTimer = setTimeout(() => hint.classList.remove("show"), 3200);
  }

  function updateAmbient() {
    const art = $("tf-stage-art") || $("np-art") || $("tf-dock-art");
    const glow = $("tf-ambient-glow");
    if (!glow || !art?.src) return;
    // Lightweight hue from art URL hash — avoids CORS canvas issues
    let h = 0;
    for (let i = 0; i < art.src.length; i++) h = (h * 31 + art.src.charCodeAt(i)) >>> 0;
    const hue = h % 360;
    glow.style.setProperty("--tf-ambient", `hsl(${hue} 42% 55%)`);
  }

  function ensureStageGlow() {
    const stage = $("tf-stage");
    if (!stage || $("tf-ambient-glow")) return;
    const g = el("div", "tf-ambient-glow");
    g.id = "tf-ambient-glow";
    stage.prepend(g);
  }

  function renderStageQueue() {
    const stage = $("tf-stage");
    if (!stage) return;
    let box = $("tf-stage-queue");
    if (!box) {
      box = el("div", "tf-stage-queue");
      box.id = "tf-stage-queue";
      stage.appendChild(box);
    }
    const p = window.tfPlayer;
    const q = p?.queue || [];
    box.replaceChildren();
    box.append(el("h4", "", "UP NEXT"));
    if (!q.length) {
      box.append(el("div", "tf-sq-row", "Queue is empty — open a release or import audio."));
      return;
    }
    q.forEach((t, i) => {
      const row = el("div", "tf-sq-row" + (i === p.trackIndex ? " active" : ""));
      row.append(el("strong", "", t.title || `Track ${i + 1}`));
      row.append(el("span", "", i === p.trackIndex ? "NOW" : String(i + 1).padStart(2, "0")));
      row.addEventListener("click", () => playAt(i));
      box.append(row);
    });
  }

  function mountMoodStrip() {
    const home = document.querySelector('[data-page="home"]');
    if (!home || $("tf-mood-strip")) return;
    const hero = home.querySelector(".hero-grid, .section, .route-heading") || home.firstElementChild;
    const strip = el("div", "tf-mood-strip");
    strip.id = "tf-mood-strip";
    const moods = [
      ["Persian Trap", "releases"],
      ["Late night", "now-playing"],
      ["New drops", "releases"],
      ["Discussion", "community"],
      ["Lyrics room", "lyrics"],
      ["Your library", "library"]
    ];
    moods.forEach(([label, hash]) => {
      const b = el("button", "tf-mood-chip", label);
      b.type = "button";
      b.addEventListener("click", () => { location.hash = hash; });
      strip.append(b);
    });
    if (hero) hero.insertAdjacentElement("afterend", strip);
    else home.prepend(strip);
  }

  function mountPresence() {
    const feed = document.querySelector(".community-feed") || $("tf-community-posts")?.parentElement;
    if (!feed || $("tf-presence")) return;
    const bar = el("div", "tf-presence");
    bar.id = "tf-presence";
    bar.innerHTML = `
      <img id="tf-presence-art" alt="">
      <div><strong id="tf-presence-title">Nothing playing</strong><span id="tf-presence-sub">Share what you’re hearing with the room</span></div>
      <button type="button" id="tf-presence-share">Share to room</button>`;
    feed.insertAdjacentElement("afterbegin", bar);
    $("tf-presence-share")?.addEventListener("click", onShareNowPlaying);
  }

  function syncPresence() {
    const p = window.tfPlayer;
    const track = p?.queue?.[p.trackIndex];
    const album = p?.album || {};
    if ($("tf-presence-title")) $("tf-presence-title").textContent = track?.title || "Nothing playing";
    if ($("tf-presence-sub")) {
      $("tf-presence-sub").textContent = track
        ? ((window.tfLocalMode ? "Local audio" : album.artist || "TRAPFARSI") + " · public discussion")
        : "Share what you’re hearing with the room";
    }
    if ($("tf-presence-art") && album.art) $("tf-presence-art").src = album.art;
  }

  function updateFooter() {
    const foot = document.querySelector(".footer");
    if (!foot) return;
    const right = foot.querySelector("span:last-child");
    if (right) {
      right.innerHTML = `PHASE 08 / STUDIO MAX <span class="tf-phase-badge">BEST BUILD</span>`;
    }
  }

  function patchAdvanceOnEnd() {
    // When demo seconds hit duration, respect repeat/shuffle
    const orig = window.tfRenderPlayer;
    if (typeof orig !== "function") return;
    window.tfRenderPlayer = function () {
      orig.apply(this, arguments);
      try {
        updateAmbient();
        renderStageQueue();
        syncPresence();
        mountTransportExtras();
      } catch (_) {}
    };
  }

  // Smarter next when user clicks next and when track completes
  function enhanceNextPrev() {
    document.addEventListener("click", e => {
      const b = e.target.closest("[data-player], [data-tf-act]");
      if (!b) return;
      const act = b.dataset.player || b.dataset.tfAct;
      if (act === "next") {
        // After default handler, if shuffle we re-roll
        if (shuffle) {
          e.stopImmediatePropagation();
          playAt(nextIndex(1));
        }
      }
    }, true);
  }

  // Repeat-one: when seconds reach end, restart same track
  setInterval(() => {
    const p = window.tfPlayer;
    if (!p || !p.playing) return;
    if (repeat === "one" && p.duration && p.seconds >= p.duration - 0.5) {
      p.seconds = 0;
      if (window.tfLocalAudio) {
        try {
          window.tfLocalAudio.currentTime = 0;
          window.tfLocalAudio.play();
        } catch (_) {}
      }
      if (typeof window.tfRenderPlayer === "function") window.tfRenderPlayer();
    }
  }, 400);

  function init() {
    injectStyles();
    mountThemeToggle();
    applyTheme();
    mountTransportExtras();
    ensureStageGlow();
    mountMoodStrip();
    mountPresence();
    updateFooter();
    bindGlobalClicks();
    bindKeyboard();
    wireEndBehavior();
    patchAdvanceOnEnd();
    enhanceNextPrev();
    updateTransportButtons();
    if (typeof window.tfRenderPlayer === "function") window.tfRenderPlayer();
    // Show hotkeys once per session
    if (!sessionStorage.getItem("tf_hotkeys_seen")) {
      sessionStorage.setItem("tf_hotkeys_seen", "1");
      setTimeout(showHotkeys, 1400);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
