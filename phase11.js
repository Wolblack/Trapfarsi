/* TRAPFARSI lyric-aware search. Local matching works without a provider. */
(() => {
  const $ = (id) => document.getElementById(id);
  const state = { mode: "All", timer: null, request: 0 };
  const normalize = (value) => String(value || "").normalize("NFKC").toLocaleLowerCase().replace(/[\u064B-\u065F\u0670\u0640]/g, "").replace(/[يى]/g, "ی").replace(/ك/g, "ک").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
  const includesQuery = (haystack, query) => {
    const h = normalize(haystack), q = normalize(query);
    if (!q) return false;
    return h.includes(q) || q.split(" ").filter(Boolean).every(token => h.includes(token));
  };
  const readJSON = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; } };
  const localNotes = () => {
    const raw = readJSON("tf_lyrics_notes_v1", {});
    if (!raw || typeof raw !== "object") return [];
    return Object.entries(raw).flatMap(([key, value]) => {
      const text = typeof value === "string" ? value : (value && typeof value === "object" ? (value.text || value.notes || value.lyrics || "") : "");
      return text.trim() ? [{ title: key, artist: "Your notes", snippet: text.slice(0, 500), source: "Personal notes", local: true }] : [];
    });
  };
  const escapeText = (el, text) => { el.textContent = String(text || ""); };
  function getData() {
    const albumList = Array.isArray(window.albums) ? window.albums : (typeof albums !== "undefined" ? albums : []);
    const artistList = Array.isArray(window.artists) ? window.artists : (typeof artists !== "undefined" ? artists : []);
    return { albumList, artistList };
  }
  function card(item, kind) {
    const node = document.createElement("article"); node.className = "search-result glass tf-lyrics-search-result";
    const art = document.createElement("div"); art.className = "tf-lyrics-search-art";
    if (item.art || item.cover) {
      try { const imageUrl = new URL(item.art || item.cover, window.location.href); if (imageUrl.protocol === "https:") { const img = document.createElement("img"); img.src = imageUrl.href; img.alt = ""; img.loading = "lazy"; art.append(img); } else art.textContent = kind === "Lyrics" ? "♫" : "T."; }
      catch { art.textContent = kind === "Lyrics" ? "♫" : "T."; }
    }
    else art.textContent = kind === "Lyrics" ? "♫" : "T.";
    const body = document.createElement("div"); body.className = "tf-lyrics-search-copy";
    const title = document.createElement("strong"); escapeText(title, item.title || item.track || item.name || "Untitled");
    const meta = document.createElement("span"); escapeText(meta, [item.artist || item.artist_name || item.sub, item.album, item.year].filter(Boolean).join(" · "));
    body.append(title, meta);
    if (item.snippet) { const snippet = document.createElement("p"); snippet.className = "tf-lyrics-snippet"; escapeText(snippet, item.snippet); body.append(snippet); }
    const badge = document.createElement("span"); badge.className = "search-result-type"; escapeText(badge, kind.toUpperCase());
    node.append(art, body, badge);
    if (item.url || item.track_share_url) {
      try {
        const target = new URL(item.url || item.track_share_url, window.location.href);
        if (target.protocol === "https:") { const link = document.createElement("a"); link.className = "tf-lyrics-open"; link.href = target.href; link.target = "_blank"; link.rel = "noopener noreferrer"; link.textContent = "Open ↗"; link.setAttribute("aria-label", "Open song source in a new tab"); node.append(link); }
      } catch { /* Do not render malformed provider links. */ }
    }
    return node;
  }
  function setMessage(message, busy = false) {
    const box = $("search-results"), empty = $("search-empty");
    if (!box || !empty) return;
    empty.classList.add("visible"); empty.style.display = "block"; empty.replaceChildren();
    const title = document.createElement("strong"); title.textContent = busy ? "Searching lyrics…" : message;
    const detail = document.createElement("p"); detail.textContent = busy ? "Checking your local notes and the configured lyrics provider." : "Search a phrase you remember. Lyrics-provider results require a configured server-side integration; local notes work immediately.";
    empty.append(title, detail);
  }
  function renderLocal(q) {
    const { albumList, artistList } = getData();
    const results = [];
    if (state.mode !== "Lyrics" && state.mode !== "Artist") albumList.filter(a => includesQuery([a.title, a.artist, a.genre, a.year, a.type].join(" "), q)).forEach(a => results.push({ ...a, title: a.title, artist: a.artist, source: "Catalogue" , kind: "Release" }));
    if (state.mode !== "Lyrics" && state.mode !== "Release") artistList.filter(a => includesQuery([a.name, a.kind, a.genre].join(" "), q)).forEach(a => results.push({ title: a.name, artist: a.kind, art: a.art, source: "Artist directory", kind: "Artist" }));
    if (state.mode === "Lyrics" || state.mode === "All") localNotes().filter(n => includesQuery(n.snippet + " " + n.title, q)).forEach(n => results.push({ ...n, kind: "Personal lyrics/notes" }));
    return results;
  }
  async function search() {
    const input = $("search-field"), box = $("search-results"), empty = $("search-empty"), count = $("search-count");
    if (!input || !box || !empty || !count) return;
    const q = input.value.trim(); const request = ++state.request;
    box.replaceChildren();
    if (!q) { count.textContent = "Search catalogue + lyrics"; setMessage("Search everything, including lyrics"); return; }
    const local = renderLocal(q);
    local.forEach(item => box.append(card(item, item.kind || "Lyrics")));
    count.textContent = `${local.length} local result${local.length === 1 ? "" : "s"}`;
    empty.classList.remove("visible"); empty.style.display = "none";
    if (state.mode === "Artist" || state.mode === "Release") {
      if (!local.length) setMessage(`No local matches for “${q}”.`);
      return;
    }
    const endpoint = String(window.TRAPFARSI_LYRICS_SEARCH_URL || "").trim();
    if (state.mode !== "Lyrics" && !endpoint) {
      if (!local.length) setMessage(`No matches for “${q}”. Try Lyrics to search personal notes, or configure a licensed lyrics provider.`);
      return;
    }
    if (state.mode === "Lyrics" && !endpoint) {
      if (!local.length) setMessage(`No lyric matches for “${q}”. Your personal notes are searched locally. Configure the server-side lyrics provider to search a licensed catalogue.`);
      return;
    }
    setMessage("Searching the lyrics catalogue", true);
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", ...(window.TRAPFARSI_SUPABASE_ANON_KEY ? { apikey: window.TRAPFARSI_SUPABASE_ANON_KEY, Authorization: `Bearer ${window.TRAPFARSI_SUPABASE_ANON_KEY}` } : {}) }, body: JSON.stringify({ query: q }), signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error(response.status === 429 ? "Too many searches. Wait a moment and try again." : `Lyrics provider returned ${response.status}.`);
      const payload = await response.json();
      if (request !== state.request) return;
      const tracks = Array.isArray(payload.results) ? payload.results : [];
      const seen = new Set(local.map(x => normalize((x.title || "") + " " + (x.artist || ""))));
      let added = 0;
      tracks.forEach(track => {
        const key = normalize((track.title || track.track_name || "") + " " + (track.artist || track.artist_name || ""));
        if (!key || seen.has(key)) return; seen.add(key);
        box.append(card({ title: track.title || track.track_name, artist: track.artist || track.artist_name, album: track.album || track.album_name, cover: track.cover || track.album_coverart_100x100, snippet: track.snippet || "Matched by lyric phrase. Full lyrics are not displayed by this search integration.", url: track.url || track.track_share_url }, "Lyrics match")); added++;
      });
      count.textContent = `${local.length + added} result${local.length + added === 1 ? "" : "s"}`;
      if (!box.children.length) setMessage(`No matches found for “${q}”. Try fewer words or a distinctive phrase.`);
      else { empty.classList.remove("visible"); empty.style.display = "none"; }
    } catch (error) {
      if (request !== state.request) return;
      count.textContent = `${local.length} local result${local.length === 1 ? "" : "s"}`;
      if (!box.children.length) setMessage(`${error.message || "Lyrics search is temporarily unavailable."} Local catalogue and notes search still works.`);
      else { const note = document.createElement("p"); note.className = "tf-lyrics-provider-note"; note.textContent = "Online lyrics search unavailable; showing local matches."; box.append(note); }
    }
  }
  function init() {
    const input = $("search-field"), filters = document.querySelector(".search-filters");
    if (!input || !filters) return;
    // Replace input to remove older duplicate handlers that only searched titles.
    const replacement = input.cloneNode(true); input.replaceWith(replacement);
    replacement.placeholder = "Search artist, title, or a lyric phrase…";
    replacement.setAttribute("aria-label", "Search music by title, artist, or lyric phrase");
    const oldFilters = [...filters.querySelectorAll("button")];
    oldFilters.forEach(btn => { const clone = btn.cloneNode(true); btn.replaceWith(clone); });
    // The current HTML may already include Lyrics. Never append a duplicate mode.
    if (!filters.querySelector('button[data-search-type="Lyrics"]')) {
      const lyricsButton = document.createElement("button"); lyricsButton.type = "button"; lyricsButton.className = "search-filter"; lyricsButton.dataset.searchType = "Lyrics"; lyricsButton.textContent = "Lyrics"; lyricsButton.setAttribute("aria-pressed", "false"); filters.append(lyricsButton);
    }
    filters.querySelectorAll("button[data-search-type]").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.searchType === "All"));
      button.addEventListener("click", () => {
        state.mode = button.dataset.searchType;
        filters.querySelectorAll("button[data-search-type]").forEach(other => { const active = other === button; other.classList.toggle("active", active); other.setAttribute("aria-pressed", String(active)); });
        search();
      });
    });
    replacement.addEventListener("input", () => { clearTimeout(state.timer); state.timer = setTimeout(search, 240); });
    replacement.addEventListener("keydown", event => { if (event.key === "Escape") { replacement.value = ""; search(); } });
    const searchPage = $("page-search");
    if (searchPage) {
      const p = searchPage.querySelector(".route-heading p");
      if (p) p.textContent = "Find artists, releases, or a song from a phrase you remember. Local notes search instantly; online lyric matching activates when a licensed provider is configured.";
      const disclaimer = searchPage.querySelector(".release-disclaimer");
      if (disclaimer) disclaimer.textContent = "LOCAL SEARCH WORKS OFFLINE · ONLINE LYRIC SEARCH REQUIRES A CONFIGURED LICENSED PROVIDER";
    }
    setMessage("Search titles, artists, or a phrase from the lyrics");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
})();
