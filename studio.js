/* TRAPFARSI Studio — premium player modes, glass lyrics, discussion polish.
 * Modes: dock (bottom bar) · compact (Apple Music mini pill) · stage (full immersive).
 */
(() => {
  "use strict";
  const MODE_KEY = "tf_player_mode_v1";
  const modes = ["dock", "compact", "stage"];
  let mode = localStorage.getItem(MODE_KEY) || "dock";
  if (!modes.includes(mode)) mode = "dock";

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function injectStyles() {
    if ($("tf-studio-style")) return;
    const s = document.createElement("style");
    s.id = "tf-studio-style";
    s.textContent = `
/* ── Player shell ── */
.tf-player-shell{position:fixed;z-index:40;left:0;right:0;bottom:0;pointer-events:none}
.tf-player-shell *{pointer-events:auto}
.tf-player-shell[data-mode="stage"]{inset:0;display:flex;align-items:flex-end;justify-content:center;background:rgba(18,22,30,.55);backdrop-filter:blur(18px) saturate(1.2);-webkit-backdrop-filter:blur(18px) saturate(1.2)}

/* Dock — full bottom bar (Apple Music-ish) */
.tf-dock{display:none;align-items:center;gap:14px;margin:0 12px 12px;padding:12px 16px;border-radius:22px;
  background:rgba(255,255,255,.78);border:1px solid rgba(255,255,255,.85);
  box-shadow:0 12px 40px rgba(30,40,60,.12), inset 0 1px 0 #fff;
  backdrop-filter:blur(24px) saturate(1.4);-webkit-backdrop-filter:blur(24px) saturate(1.4)}
.tf-player-shell[data-mode="dock"] .tf-dock{display:flex}
.tf-dock-art{width:52px;height:52px;border-radius:12px;object-fit:cover;box-shadow:4px 6px 14px rgba(40,50,70,.18);flex-shrink:0;background:#e8eaef}
.tf-dock-meta{min-width:0;flex:1}
.tf-dock-meta strong{display:block;font:750 13px/1.2 Manrope,Inter,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tf-dock-meta span{display:block;font-size:11px;color:#7a8190;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tf-dock-controls{display:flex;align-items:center;gap:6px}
.tf-dock-btn{width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.9);background:linear-gradient(145deg,#f8f9fb,#e8ecf2);
  box-shadow:4px 4px 10px #c5ccd655,-3px -3px 8px #fff;cursor:pointer;font-size:14px;color:#2a303c;display:grid;place-items:center}
.tf-dock-btn.primary{width:48px;height:48px;font-size:16px;background:linear-gradient(145deg,#2c3340,#1a1f28);color:#fff;border-color:#1a1f28}
.tf-dock-progress{position:absolute;left:18px;right:18px;bottom:0;height:3px;border-radius:2px;background:#d5d9e0;overflow:hidden}
.tf-dock-progress>span{display:block;height:100%;width:0;background:linear-gradient(90deg,#3a4150,#6b7485);transition:width .2s linear}
.tf-dock-wrap{position:relative;width:100%;max-width:920px;margin:0 auto}
.tf-dock-modes{display:flex;gap:4px;margin-left:4px}
.tf-mode-chip{border:1px solid #ffffffd0;background:#ffffffa0;border-radius:999px;padding:7px 10px;font-size:10px;font-weight:700;color:#5c6472;cursor:pointer;letter-spacing:.02em}
.tf-mode-chip.active{background:#2a303c;color:#fff;border-color:#2a303c}

/* Compact — floating Apple Music mini */
.tf-compact{display:none;position:fixed;bottom:18px;left:50%;transform:translateX(-50%);z-index:41;
  width:min(360px,calc(100vw - 28px));padding:10px 12px;border-radius:999px;align-items:center;gap:10px;
  background:rgba(255,255,255,.82);border:1px solid rgba(255,255,255,.9);
  box-shadow:0 16px 48px rgba(25,35,55,.18), inset 0 1px 0 #fff;
  backdrop-filter:blur(28px) saturate(1.5);-webkit-backdrop-filter:blur(28px) saturate(1.5)}
.tf-player-shell[data-mode="compact"] .tf-compact{display:flex}
.tf-compact img{width:40px;height:40px;border-radius:50%;object-fit:cover;box-shadow:3px 4px 10px rgba(40,50,70,.2)}
.tf-compact-meta{min-width:0;flex:1}
.tf-compact-meta strong{display:block;font:750 12px/1.15 Manrope,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tf-compact-meta span{display:block;font-size:10px;color:#808792;margin-top:2px}
.tf-compact .tf-dock-btn{width:36px;height:36px;font-size:13px}
.tf-compact .tf-dock-btn.primary{width:40px;height:40px}

/* Stage — immersive full player */
.tf-stage{display:none;width:min(520px,100%);max-height:min(92vh,780px);margin:0 14px 14px;padding:22px 22px 18px;border-radius:32px;
  background:rgba(255,255,255,.88);border:1px solid rgba(255,255,255,.95);
  box-shadow:0 30px 80px rgba(20,30,50,.28), inset 0 1px 0 #fff;
  backdrop-filter:blur(30px) saturate(1.35);-webkit-backdrop-filter:blur(30px) saturate(1.35);overflow:auto}
.tf-player-shell[data-mode="stage"] .tf-stage{display:block}
.tf-stage-art-wrap{width:min(100%,320px);margin:8px auto 18px;padding:12px;border-radius:28px;background:linear-gradient(145deg,#fff,#e6eaf0);box-shadow:12px 16px 32px #b8c0cc44,-8px -8px 24px #fff}
.tf-stage-art-wrap img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:20px;display:block}
.tf-stage h2{text-align:center;font:800 clamp(22px,4vw,30px)/1.15 Manrope,sans-serif;letter-spacing:-.8px;margin:0 0 4px}
.tf-stage .tf-stage-artist{text-align:center;color:#7a8190;font-size:13px;margin:0 0 18px}
.tf-stage-controls{display:flex;justify-content:center;align-items:center;gap:16px;margin:10px 0 16px}
.tf-stage-seek{display:grid;grid-template-columns:40px 1fr 40px;gap:10px;align-items:center;font-size:11px;color:#7a8190;margin-bottom:12px}
.tf-stage-seek input[type=range]{width:100%;accent-color:#2a303c}
.tf-stage-vol{display:flex;align-items:center;gap:10px;font-size:10px;color:#8a909b;margin-bottom:14px}
.tf-stage-vol input{flex:1;accent-color:#2a303c}
.tf-stage-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.tf-stage-actions button{border:1px solid #ffffffd0;background:#ffffffa8;border-radius:999px;padding:10px 14px;font-size:11px;font-weight:700;cursor:pointer;color:#3a4150}
.tf-stage-close{position:absolute;top:14px;right:16px;width:36px;height:36px;border-radius:50%;border:1px solid #ffffffd0;background:#ffffffc0;cursor:pointer;font-size:16px}

/* Hide legacy mini when studio is active */
body.tf-studio-on #mini-player{display:none !important}
body.tf-studio-on .shell{padding-bottom:96px}

/* ── Glass lyrics room ── */
.tf-lyrics-stage{position:relative;max-width:720px;margin:0 auto 40px;padding:28px 22px 36px;border-radius:28px;
  background:rgba(255,255,255,.55);border:1px solid rgba(255,255,255,.85);
  box-shadow:0 20px 50px rgba(40,50,70,.08), inset 0 1px 0 #fff;
  backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
.tf-lyrics-glow{position:absolute;inset:auto 10% -40px;height:80px;background:radial-gradient(ellipse,rgba(120,140,180,.18),transparent 70%);pointer-events:none;filter:blur(12px)}
.tf-lyrics-head{display:flex;align-items:center;gap:16px;margin-bottom:22px;padding-bottom:18px;border-bottom:1px solid rgba(180,188,200,.35)}
.tf-lyrics-head img{width:72px;height:72px;border-radius:18px;object-fit:cover;box-shadow:6px 8px 18px rgba(50,60,80,.15)}
.tf-lyrics-head h2{margin:4px 0;font:800 22px/1.15 Manrope,sans-serif;letter-spacing:-.6px}
.tf-lyrics-head p{margin:0;color:#7a8190;font-size:12px}
.tf-lyrics-lines{min-height:220px;max-height:48vh;overflow:auto;padding:8px 4px 24px;scroll-behavior:smooth}
.tf-lyric-line{padding:10px 14px;margin:4px 0;border-radius:14px;font:500 clamp(15px,2.4vw,19px)/1.55 Manrope,Inter,sans-serif;color:#9aa1ad;transition:color .25s,background .25s,transform .25s;cursor:default}
.tf-lyric-line.active{color:#1c212b;background:rgba(255,255,255,.72);box-shadow:inset 0 0 0 1px rgba(255,255,255,.9), 0 6px 18px rgba(40,50,70,.06);transform:scale(1.02);font-weight:650}
.tf-lyric-line.near{color:#5c6472}
.tf-lyrics-empty{text-align:center;padding:40px 16px;color:#8a909b;font-size:13px;line-height:1.7}
.tf-lyrics-editor-wrap{margin-top:18px;padding-top:16px;border-top:1px solid rgba(180,188,200,.3)}
.tf-lyrics-editor-wrap textarea{width:100%;min-height:120px;border-radius:16px;border:1px solid rgba(255,255,255,.9);background:rgba(255,255,255,.65);padding:14px;font:13px/1.6 Inter,sans-serif;resize:vertical;box-sizing:border-box}
.tf-lyrics-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;margin-top:10px}

/* ── Community discussion polish ── */
.tf-discuss-banner{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;padding:16px 18px;margin:0 0 18px;border-radius:20px;
  background:linear-gradient(135deg,rgba(255,255,255,.75),rgba(240,244,250,.8));border:1px solid rgba(255,255,255,.9);
  box-shadow:0 10px 28px rgba(40,50,70,.06)}
.tf-discuss-banner h3{margin:0;font:750 16px/1.2 Manrope,sans-serif}
.tf-discuss-banner p{margin:4px 0 0;font-size:12px;color:#7a8190}
.community-post{transition:transform .15s,box-shadow .15s}
.community-post:hover{transform:translateY(-1px);box-shadow:0 12px 28px rgba(40,50,70,.08)}

@media(max-width:640px){
  .tf-dock{margin:0 8px 8px;padding:10px 12px;gap:10px}
  .tf-dock-art{width:44px;height:44px}
  .tf-dock-modes{display:none}
  .tf-mode-chip{padding:6px 8px}
  body.tf-studio-on .shell{padding-bottom:88px}
}
`;
    document.head.appendChild(s);
  }

  function buildShell() {
    if ($("tf-player-shell")) return $("tf-player-shell");
    const shell = el("div", "tf-player-shell");
    shell.id = "tf-player-shell";
    shell.dataset.mode = mode;
    shell.innerHTML = `
      <div class="tf-dock-wrap">
        <div class="tf-dock" id="tf-dock">
          <img class="tf-dock-art" id="tf-dock-art" alt="">
          <div class="tf-dock-meta"><strong id="tf-dock-title">Nothing playing</strong><span id="tf-dock-artist">TRAPFARSI</span></div>
          <div class="tf-dock-controls">
            <button type="button" class="tf-dock-btn" data-tf-act="prev" aria-label="Previous">⏮</button>
            <button type="button" class="tf-dock-btn primary" data-tf-act="toggle" aria-label="Play or pause">▶</button>
            <button type="button" class="tf-dock-btn" data-tf-act="next" aria-label="Next">⏭</button>
          </div>
          <div class="tf-dock-modes" role="group" aria-label="Player layout">
            <button type="button" class="tf-mode-chip" data-tf-mode="dock" title="Dock bar">Dock</button>
            <button type="button" class="tf-mode-chip" data-tf-mode="compact" title="Compact mini">Mini</button>
            <button type="button" class="tf-mode-chip" data-tf-mode="stage" title="Full stage">Stage</button>
          </div>
          <div class="tf-dock-progress"><span id="tf-dock-progress"></span></div>
        </div>
      </div>
      <div class="tf-compact" id="tf-compact">
        <img id="tf-compact-art" alt="">
        <div class="tf-compact-meta"><strong id="tf-compact-title">Nothing playing</strong><span id="tf-compact-artist">TRAPFARSI</span></div>
        <button type="button" class="tf-dock-btn primary" data-tf-act="toggle" aria-label="Play or pause">▶</button>
        <button type="button" class="tf-dock-btn" data-tf-mode="stage" aria-label="Expand">↗</button>
        <button type="button" class="tf-dock-btn" data-tf-mode="dock" aria-label="Dock mode" title="Dock">▭</button>
      </div>
      <div class="tf-stage" id="tf-stage" role="dialog" aria-label="Now playing stage">
        <button type="button" class="tf-stage-close" data-tf-mode="dock" aria-label="Close stage">×</button>
        <div class="tf-stage-art-wrap"><img id="tf-stage-art" alt=""></div>
        <h2 id="tf-stage-title">Nothing playing</h2>
        <p class="tf-stage-artist" id="tf-stage-artist">TRAPFARSI</p>
        <div class="tf-stage-seek"><span id="tf-stage-cur">0:00</span><input type="range" id="tf-stage-seek" min="0" max="180" value="0" aria-label="Seek"><span id="tf-stage-dur">0:00</span></div>
        <div class="tf-stage-controls">
          <button type="button" class="tf-dock-btn" data-tf-act="prev" aria-label="Previous">⏮</button>
          <button type="button" class="tf-dock-btn primary" data-tf-act="toggle" aria-label="Play or pause">▶</button>
          <button type="button" class="tf-dock-btn" data-tf-act="next" aria-label="Next">⏭</button>
        </div>
        <div class="tf-stage-vol"><span>VOLUME</span><input type="range" id="tf-stage-vol" min="0" max="100" value="70" aria-label="Volume"><span id="tf-stage-vol-val">70%</span></div>
        <div class="tf-stage-actions">
          <button type="button" data-tf-goto="lyrics">Lyrics</button>
          <button type="button" data-tf-goto="community">Discussion</button>
          <button type="button" data-tf-goto="profile">Library</button>
          <button type="button" data-tf-mode="compact">Mini player</button>
        </div>
      </div>`;
    document.body.appendChild(shell);
    return shell;
  }

  function setMode(next) {
    if (!modes.includes(next)) return;
    mode = next;
    localStorage.setItem(MODE_KEY, mode);
    const shell = $("tf-player-shell");
    if (shell) shell.dataset.mode = mode;
    document.querySelectorAll("[data-tf-mode]").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-tf-mode") === mode);
    });
  }

  function fmt(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
  }

  function syncFromPlayer() {
    const p = window.tfPlayer;
    if (!p) return;
    const track = (p.queue && p.queue[p.trackIndex]) || {};
    const album = p.album || {};
    const title = track.title || "Nothing playing";
    const artist = window.tfLocalMode ? "Local audio" : (album.artist || "TRAPFARSI");
    const art = album.art || "";
    const playing = !!p.playing;
    const icon = playing ? "❚❚" : "▶";
    const progress = Math.min(100, ((p.seconds || 0) / (p.duration || 180)) * 100);

    const map = [
      ["tf-dock-title", title], ["tf-dock-artist", artist],
      ["tf-compact-title", title], ["tf-compact-artist", artist],
      ["tf-stage-title", title], ["tf-stage-artist", artist]
    ];
    map.forEach(([id, v]) => { const n = $(id); if (n) n.textContent = v; });
    ["tf-dock-art", "tf-compact-art", "tf-stage-art"].forEach(id => {
      const n = $(id); if (n && art) n.src = art;
    });
    document.querySelectorAll('[data-tf-act="toggle"]').forEach(b => { b.textContent = icon; });
    const bar = $("tf-dock-progress");
    if (bar) bar.style.width = progress + "%";
    const cur = $("tf-stage-cur"); if (cur) cur.textContent = fmt(p.seconds);
    const dur = $("tf-stage-dur"); if (dur) dur.textContent = fmt(p.duration || 180);
    const seek = $("tf-stage-seek");
    if (seek && document.activeElement !== seek) {
      seek.max = Math.max(1, p.duration || 180);
      seek.value = p.seconds || 0;
    }
  }

  function bindControls() {
    const shell = $("tf-player-shell");
    shell.addEventListener("click", e => {
      const act = e.target.closest("[data-tf-act]");
      if (act) {
        const a = act.getAttribute("data-tf-act");
        const btn = document.querySelector(`.mini-action[data-player="${a === "toggle" ? "toggle" : a}"], [data-player="${a === "toggle" ? "toggle" : a === "prev" ? "previous" : "next"}"]`);
        if (a === "toggle") {
          const t = document.querySelector('[data-player="toggle"]');
          if (t) t.click();
        } else if (a === "prev") {
          const t = document.querySelector('[data-player="previous"]');
          if (t) t.click();
        } else if (a === "next") {
          const t = document.querySelector('[data-player="next"]');
          if (t) t.click();
        }
        setTimeout(syncFromPlayer, 50);
        return;
      }
      const m = e.target.closest("[data-tf-mode]");
      if (m) { setMode(m.getAttribute("data-tf-mode")); return; }
      const go = e.target.closest("[data-tf-goto]");
      if (go) {
        location.hash = go.getAttribute("data-tf-goto");
        if (mode === "stage") setMode("dock");
      }
    });
    $("tf-stage-seek")?.addEventListener("input", e => {
      const np = $("np-seek");
      if (np) {
        np.value = e.target.value;
        np.dispatchEvent(new Event("input", { bubbles: true }));
      }
      if (window.tfPlayer) window.tfPlayer.seconds = Number(e.target.value) || 0;
      syncFromPlayer();
    });
    $("tf-stage-vol")?.addEventListener("input", e => {
      const v = Number(e.target.value);
      const np = $("np-volume");
      if (np) {
        np.value = v;
        np.dispatchEvent(new Event("input", { bubbles: true }));
      }
      const label = $("tf-stage-vol-val");
      if (label) label.textContent = v + "%";
    });
  }

  /* ── Lyrics glass view ── */
  function parseLyricLines(text) {
    return String(text || "")
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean);
  }

  function enhanceLyricsPage() {
    const page = document.querySelector('[data-page="lyrics"]');
    if (!page || page.dataset.studioLyrics) return;
    page.dataset.studioLyrics = "1";

    const card = page.querySelector(".lyrics-card");
    if (!card) return;

    const stage = el("div", "tf-lyrics-stage");
    stage.innerHTML = `
      <div class="tf-lyrics-glow"></div>
      <div class="tf-lyrics-head">
        <img id="tf-lx-art" alt="">
        <div>
          <span class="eyebrow">LYRICS · GLASS ROOM</span>
          <h2 id="tf-lx-title">Nothing selected</h2>
          <p id="tf-lx-artist">Import a track or pick a release</p>
        </div>
      </div>
      <div class="tf-lyrics-lines" id="tf-lx-lines" aria-live="polite"></div>
      <div class="tf-lyrics-editor-wrap">
        <label class="field-label" for="tf-lyrics-text">Write or paste lyrics / notes (one line per phrase)</label>
        <div class="tf-lyrics-toolbar">
          <span id="tf-lyrics-status">Saved locally per track · no copyrighted fetch</span>
          <button class="primary-button" type="button" id="tf-lx-refresh">Preview lines</button>
        </div>
      </div>`;

    // Move existing textarea into new wrap
    const oldTextarea = $("tf-lyrics-text");
    const oldSave = $("tf-lyrics-save");
    card.replaceWith(stage);
    const wrap = stage.querySelector(".tf-lyrics-editor-wrap");
    if (oldTextarea) {
      oldTextarea.className = "community-input lyrics-editor";
      oldTextarea.placeholder = "One lyric line per row…\nYour own words, translations, or listening notes.";
      wrap.insertBefore(oldTextarea, wrap.querySelector(".tf-lyrics-toolbar"));
    }
    if (oldSave) {
      oldSave.textContent = "Save lyrics";
      wrap.querySelector(".tf-lyrics-toolbar").appendChild(oldSave);
    }

    // Hide old head elements if still present
    ["tf-lyrics-art", "tf-lyrics-title", "tf-lyrics-artist"].forEach(id => {
      const n = $(id);
      if (n && !stage.contains(n)) n.hidden = true;
    });

    function renderLines() {
      const linesBox = $("tf-lx-lines");
      if (!linesBox) return;
      const text = ($("tf-lyrics-text")?.value) || "";
      const lines = parseLyricLines(text);
      linesBox.replaceChildren();
      if (!lines.length) {
        const empty = el("div", "tf-lyrics-empty");
        empty.innerHTML = "No lyrics yet.<br>Write a line per phrase below — they’ll light up in this glass stage while you listen.";
        linesBox.append(empty);
        return;
      }
      lines.forEach((line, i) => {
        const row = el("div", "tf-lyric-line", line);
        row.dataset.i = String(i);
        linesBox.append(row);
      });
    }

    function highlightByProgress() {
      const p = window.tfPlayer;
      const linesBox = $("tf-lx-lines");
      if (!p || !linesBox) return;
      const rows = [...linesBox.querySelectorAll(".tf-lyric-line")];
      if (!rows.length) return;
      const ratio = Math.min(0.999, (p.seconds || 0) / Math.max(1, p.duration || 180));
      const idx = Math.min(rows.length - 1, Math.floor(ratio * rows.length));
      rows.forEach((row, i) => {
        row.classList.toggle("active", i === idx);
        row.classList.toggle("near", Math.abs(i - idx) === 1);
      });
      const active = rows[idx];
      if (active) active.scrollIntoView({ block: "center", behavior: "smooth" });
    }

    $("tf-lx-refresh")?.addEventListener("click", renderLines);
    $("tf-lyrics-text")?.addEventListener("input", () => {
      clearTimeout(window._tfLxTimer);
      window._tfLxTimer = setTimeout(renderLines, 280);
    });

    // Hook into existing render
    const prev = window.tfRenderLyrics;
    window.tfRenderLyrics = function () {
      if (typeof prev === "function") prev();
      const t = window.tfPlayer?.queue?.[window.tfPlayer.trackIndex];
      const a = window.tfPlayer?.album || {};
      if ($("tf-lx-title")) $("tf-lx-title").textContent = t?.title || "Nothing selected";
      if ($("tf-lx-artist")) $("tf-lx-artist").textContent = window.tfLocalMode ? "Local audio" : (a.artist || "TRAPFARSI");
      if ($("tf-lx-art") && a.art) $("tf-lx-art").src = a.art;
      // keep textarea in sync via original
      renderLines();
    };

    setInterval(highlightByProgress, 900);
    renderLines();
  }

  function enhanceCommunity() {
    const page = document.querySelector('[data-page="community"]');
    if (!page || page.dataset.studioCommunity) return;
    page.dataset.studioCommunity = "1";
    const heading = page.querySelector(".route-heading");
    if (!heading) return;
    const banner = el("div", "tf-discuss-banner");
    banner.innerHTML = `
      <div>
        <h3>Public discussion room</h3>
        <p>Open conversations — not DMs. Share takes on Persian trap, US rap, R&B, and new drops. Everyone in the room can read and reply.</p>
      </div>
      <button type="button" class="primary-button" id="tf-discuss-focus">Start a post</button>`;
    heading.insertAdjacentElement("afterend", banner);
    $("tf-discuss-focus")?.addEventListener("click", () => {
      $("tf-post-text")?.focus();
      $("tf-post-text")?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function wrapRenderPlayer() {
    const prev = window.tfRenderPlayer;
    if (typeof prev !== "function") return;
    window.tfRenderPlayer = function () {
      prev.apply(this, arguments);
      syncFromPlayer();
    };
  }

  function init() {
    injectStyles();
    document.body.classList.add("tf-studio-on");
    buildShell();
    setMode(mode);
    bindControls();
    enhanceLyricsPage();
    enhanceCommunity();
    wrapRenderPlayer();
    syncFromPlayer();
    setInterval(syncFromPlayer, 500);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
