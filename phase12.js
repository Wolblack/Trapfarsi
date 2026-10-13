/* TRAPFARSI Phase 12
 * Local-first reliability: IndexedDB-backed opt-in audio persistence, sleep timer,
 * and explicit JSON backup/restore. No audio, notes, or profile data is uploaded.
 */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const AUDIO_DB = "trapfarsi-local-audio";
  const AUDIO_STORE = "tracks";
  const KEEP_AUDIO_KEY = "tf_keep_audio_v1";
  const MAX_BACKUP_BYTES = 5 * 1024 * 1024;
  const ALLOWED_KEYS = new Set([
    "tf_saved", "tf_followed", "tf_history", "tf_profile_v1", "tf_playlists_v1",
    "tf_community_posts_v1", "tf_lyrics_notes_v1", "tf_avatar_mark_v1", "tf_discovery_mood_v1",
    "tf_favorites_v1", "tf_following_v1", "tf_history_v1", "tf_listener_stats_v1",
    "tf_trophies_v1", "tf_lang_v1", "tf_theme_v1", "tf_shuffle_v1", "tf_repeat_v1",
    "tf_player_mode_v1", "tf_stats_v1", "tf_feature_stats", "tf_hotkeys_seen"
  ]);
  const ARRAY_KEYS = new Set(["tf_saved", "tf_followed", "tf_history", "tf_community_posts_v1", "tf_playlists_v1", "tf_favorites_v1", "tf_following_v1", "tf_history_v1", "tf_trophies_v1"]);
  const OBJECT_KEYS = new Set(["tf_profile_v1", "tf_lyrics_notes_v1", "tf_listener_stats_v1", "tf_stats_v1", "tf_feature_stats"]);
  const STRING_KEYS = new Set(["tf_discovery_mood_v1", "tf_lang_v1", "tf_theme_v1", "tf_shuffle_v1", "tf_repeat_v1", "tf_player_mode_v1", "tf_avatar_mark_v1", "tf_hotkeys_seen"]);
  let timerInterval = null;
  let timerTimeout = null;
  let timerDeadline = 0;
  let endOfTrackTimer = false;
  let audioDbPromise = null;
  let lastCountedAudioSource = "";

  function toast12(message) {
    if (typeof window.toast === "function") window.toast(message);
    else { const node = $("toast"); if (node) { node.textContent = message; node.classList.add("show"); } }
  }
  function panel(title, description, chip) {
    const section = document.createElement("section"); section.className = "tf12-panel";
    const head = document.createElement("div"); head.className = "tf12-panel-head";
    const copy = document.createElement("div"); const h = document.createElement("h3"); h.textContent = title;
    const p = document.createElement("p"); p.textContent = description; copy.append(h, p); head.append(copy);
    if (chip) { const badge = document.createElement("span"); badge.className = "tf12-chip"; badge.textContent = chip; head.append(badge); }
    section.append(head); return section;
  }
  function makeButton(text, className, action) {
    const b = document.createElement("button"); b.type = "button"; b.className = "tf12-button" + (className ? " " + className : ""); b.textContent = text; b.addEventListener("click", action); return b;
  }
  function bytesLabel(bytes) {
    const n = Math.max(0, Number(bytes) || 0);
    if (n < 1024) return `${n} B`;
    if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
    if (n < 1024 ** 3) return `${(n / (1024 ** 2)).toFixed(1)} MB`;
    return `${(n / (1024 ** 3)).toFixed(2)} GB`;
  }
  function openAudioDB() {
    if (!("indexedDB" in window)) return Promise.reject(new Error("This browser does not support persistent audio storage."));
    if (audioDbPromise) return audioDbPromise;
    audioDbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(AUDIO_DB, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(AUDIO_STORE)) db.createObjectStore(AUDIO_STORE, { keyPath: "id" });
      };
      request.onsuccess = () => { request.result.onversionchange = () => request.result.close(); resolve(request.result); };
      request.onerror = () => reject(request.error || new Error("Could not open local audio storage."));
      request.onblocked = () => reject(new Error("Close any other TRAPFARSI tabs and try again."));
    }).catch(error => { audioDbPromise = null; throw error; });
    return audioDbPromise;
  }
  async function allSavedAudio() {
    const db = await openAudioDB();
    return new Promise((resolve, reject) => {
      const request = db.transaction(AUDIO_STORE, "readonly").objectStore(AUDIO_STORE).getAll();
      request.onsuccess = () => resolve((request.result || []).sort((a, b) => (a.name || "").localeCompare(b.name || "")));
      request.onerror = () => reject(request.error || new Error("Could not read the local audio library."));
    });
  }
  async function putAudioTracks(files) {
    const valid = files.filter(file => file && file.type && file.type.startsWith("audio/") && file.size > 0);
    if (!valid.length) throw new Error("No supported audio files were selected.");
    const db = await openAudioDB();
    const existing = await allSavedAudio();
    const ids = new Set(existing.map(item => item.id));
    const estimatedNewBytes = valid.reduce((sum, file) => {
      const id = `${file.name}\u241f${file.size}\u241f${file.lastModified}`;
      return sum + (ids.has(id) ? 0 : file.size);
    }, 0);
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        const free = Math.max(0, Number(estimate.quota || 0) - Number(estimate.usage || 0));
        if (free && estimatedNewBytes > free * 0.8) throw new Error(`Not enough estimated browser storage. New files need ${bytesLabel(estimatedNewBytes)}; only about ${bytesLabel(free)} appears available.`);
      } catch (error) { if (error instanceof Error && error.message.startsWith("Not enough estimated")) throw error; }
    }
    await new Promise((resolve, reject) => {
      const tx = db.transaction(AUDIO_STORE, "readwrite"); const store = tx.objectStore(AUDIO_STORE);
      for (const file of valid) {
        const id = `${file.name}\u241f${file.size}\u241f${file.lastModified}`;
        store.put({ id, name: file.name, size: file.size, type: file.type, lastModified: file.lastModified, savedAt: Date.now(), blob: file });
      }
      tx.oncomplete = resolve; tx.onerror = () => reject(tx.error || new Error("Could not save the selected audio files.")); tx.onabort = () => reject(tx.error || new Error("Audio saving was cancelled."));
    });
    return { count: valid.length, bytes: valid.reduce((sum, file) => sum + file.size, 0) };
  }
  async function deleteSavedAudio(id) {
    const db = await openAudioDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(AUDIO_STORE, "readwrite"); tx.objectStore(AUDIO_STORE).delete(id);
      tx.oncomplete = resolve; tx.onerror = () => reject(tx.error || new Error("Could not remove this track."));
    });
  }
  async function clearSavedAudio() {
    const db = await openAudioDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(AUDIO_STORE, "readwrite"); tx.objectStore(AUDIO_STORE).clear();
      tx.oncomplete = resolve; tx.onerror = () => reject(tx.error || new Error("Could not clear saved audio."));
    });
  }
  function makePlayableRows(rows) {
    return rows.map(row => ({ id: row.id, storedId: row.id, title: String(row.name || "Audio track").replace(/\.[^.]+$/, ""), fileName: row.name || "Audio track", size: row.size || 0, url: URL.createObjectURL(row.blob), duration: 0 }));
  }
  function showSavedAudioError(message) {
    const status = $("tf12-audio-status"); if (!status) return;
    status.textContent = message; status.classList.add("error");
  }
  function setLocalQueue(rows, autoplayIndex = null) {
    if (typeof tfLocalAudio !== "undefined") tfLocalAudio.pause();
    if (typeof tfLocalTracks !== "undefined") tfLocalTracks.forEach(track => { if (track.url && track.url.startsWith("blob:")) URL.revokeObjectURL(track.url); });
    tfLocalTracks = makePlayableRows(rows);
    tfPlayer.queue = tfLocalTracks.map(track => ({ ...track }));
    tfPlayer.trackIndex = 0; tfPlayer.seconds = 0; tfPlayer.duration = 0; tfPlayer.playing = false; tfLocalMode = tfLocalTracks.length > 0;
    if (typeof tfRenderPlayer === "function") tfRenderPlayer();
    if (tfLocalTracks.length) {
      $("np-artist").textContent = "LOCAL LIBRARY · STORED IN THIS BROWSER";
      $("mini-artist").textContent = "LOCAL LIBRARY · THIS DEVICE";
      $("np-art").src = "./icon.svg"; $("mini-art").src = "./icon.svg";
      if (autoplayIndex !== null) tfPlayLocalTrack(autoplayIndex);
      else { $("np-title").textContent = tfPlayer.queue[0].title; $("mini-title").textContent = tfPlayer.queue[0].title; }
    } else {
      tfLocalMode = false;
      tfPlayer.playing = false;
      if (typeof tfRenderPlayer === "function") tfRenderPlayer();
    }
  }
  async function renderSavedAudio() {
    const root = $("tf12-audio-list"); if (!root) return;
    root.replaceChildren();
    try {
      const rows = await allSavedAudio();
      const summary = $("tf12-audio-summary");
      if (summary) summary.textContent = rows.length ? `${rows.length} saved file${rows.length === 1 ? "" : "s"} · ${bytesLabel(rows.reduce((sum, row) => sum + (Number(row.size) || 0), 0))} stored on this device` : "No persistent audio files saved.";
      if (!rows.length) { const empty = document.createElement("p"); empty.className = "tf12-copy"; empty.textContent = "Enable ‘Remember imported audio’ before choosing files to keep a local copy between visits."; root.append(empty); return; }
      rows.forEach(row => {
        const item = document.createElement("div"); item.className = "tf12-track";
        const copy = document.createElement("div"); copy.className = "tf12-track-copy";
        const title = document.createElement("strong"); title.textContent = row.name || "Audio track";
        const meta = document.createElement("small"); meta.textContent = `${bytesLabel(row.size)} · local only`;
        copy.append(title, meta);
        const play = document.createElement("button"); play.type = "button"; play.textContent = "Play"; play.setAttribute("aria-label", `Play ${row.name || "audio track"}`);
        play.addEventListener("click", async () => {
          try { const fresh = await allSavedAudio(); setLocalQueue(fresh, Math.max(0, fresh.findIndex(x => x.id === row.id))); }
          catch (error) { showSavedAudioError(error.message || "Unable to open this file."); }
        });
        const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "Remove"; remove.setAttribute("aria-label", `Remove ${row.name || "audio track"} from persistent storage`);
        remove.addEventListener("click", async () => {
          if (!confirm(`Remove “${row.name || "this track"}” from TRAPFARSI's saved local audio? This does not delete the original file on your device.`)) return;
          try {
            await deleteSavedAudio(row.id);
            const fresh = await allSavedAudio();
            const wasLibrary = tfLocalMode && tfPlayer.queue.some(track => track.storedId);
            if (wasLibrary) setLocalQueue(fresh);
            await renderSavedAudio();
          } catch (error) { showSavedAudioError(error.message || "Unable to remove this file."); }
        });
        item.append(copy, play, remove); root.append(item);
      });
    } catch (error) {
      const status = $("tf12-audio-status"); if (status) { status.textContent = error.message || "Persistent audio storage is unavailable."; status.classList.add("error"); }
      const empty = document.createElement("p"); empty.className = "tf12-copy"; empty.textContent = "Persistent browser storage is unavailable in this session. Temporary local playback remains available."; root.append(empty);
    }
  }
  function injectAudioControls() {
    const tools = $("tf-import-audio")?.parentElement; if (!tools || $("tf12-audio-panel")) return;
    const label = document.createElement("label"); label.className = "tf12-switch";
    const toggle = document.createElement("input"); toggle.type = "checkbox"; toggle.id = "tf12-keep-audio"; toggle.checked = localStorage.getItem(KEEP_AUDIO_KEY) === "1";
    const text = document.createElement("span"); const strong = document.createElement("strong"); strong.textContent = "Remember imported audio in this browser";
    const detail = document.createElement("small"); detail.textContent = "Optional. Selected files are stored in this browser’s private site storage so they remain available after you reopen TRAPFARSI. They are not uploaded; browser storage can still be cleared by your browser or device.";
    text.append(strong, detail); label.append(toggle, text); tools.insertAdjacentElement("afterend", label);
    toggle.addEventListener("change", () => {
      localStorage.setItem(KEEP_AUDIO_KEY, toggle.checked ? "1" : "0");
      toast12(toggle.checked ? "Persistent local audio enabled. Choose files to store them." : "New imports will not be stored persistently. Existing saved audio remains until removed.");
    });
    const audioPanel = panel("Your on-device audio library", "Manage files you explicitly chose to retain in this browser. Nothing in this library is uploaded to TRAPFARSI servers.", "LOCAL ONLY");
    audioPanel.id = "tf12-audio-panel";
    const summary = document.createElement("p"); summary.className = "tf12-copy"; summary.id = "tf12-audio-summary"; summary.textContent = "Checking browser storage…";
    const list = document.createElement("div"); list.className = "tf12-track-list"; list.id = "tf12-audio-list";
    const actions = document.createElement("div"); actions.className = "tf12-actions";
    actions.append(makeButton("Refresh library", "", () => renderSavedAudio()));
    actions.append(makeButton("Forget all saved audio", "danger", async () => {
      if (!confirm("Forget all audio saved inside TRAPFARSI on this browser? Original files on your device will not be deleted.")) return;
      try {
        if (typeof tfLocalAudio !== "undefined") tfLocalAudio.pause();
        await clearSavedAudio();
        if (tfLocalMode && tfPlayer.queue.some(track => track.storedId)) setLocalQueue([]);
        await renderSavedAudio(); toast12("Saved local audio cleared.");
      } catch (error) { showSavedAudioError(error.message || "Unable to clear saved audio."); }
    }));
    const status = document.createElement("p"); status.id = "tf12-audio-status"; status.className = "tf12-status"; status.setAttribute("role", "status"); status.setAttribute("aria-live", "polite");
    audioPanel.append(summary, list, actions, status);
    const main = $("page-now-playing")?.querySelector(".now-playing-main");
    if (main) label.insertAdjacentElement("afterend", audioPanel);
    const input = $("tf-audio-files");
    if (input) input.addEventListener("change", async () => {
      const files = Array.from(input.files || []).filter(file => file.type && file.type.startsWith("audio/"));
      if (!files.length || !toggle.checked) return;
      const out = $("tf12-audio-status"); if (out) { out.classList.remove("error"); out.textContent = "Saving your selected audio into browser storage…"; }
      try {
        const result = await putAudioTracks(files);
        if (out) out.textContent = `Saved ${result.count} file${result.count === 1 ? "" : "s"} (${bytesLabel(result.bytes)} selected). Files remain on this device.`;
        await renderSavedAudio();
      } catch (error) { showSavedAudioError(error.message || "Unable to save the selected files."); }
    });
    void renderSavedAudio();
    if (toggle.checked) {
      allSavedAudio().then(rows => { if (rows.length) setLocalQueue(rows); }).catch(error => showSavedAudioError(error.message || "Saved audio could not be restored."));
    }
  }

  function correctLegacyDemoMetrics() {
    const marker = "tf_metric_truth_phase12_v1";
    if (localStorage.getItem(marker) === "1") return;
    let stats = null; let history = []; let trophies = [];
    try { stats = JSON.parse(localStorage.getItem("tf_listener_stats_v1") || "null"); } catch { /* Start clean if the old data is malformed. */ }
    try { history = JSON.parse(localStorage.getItem("tf_history_v1") || "[]"); } catch { history = []; }
    // Preserve the user's old activity. Older builds could count demo-catalogue
    // clicks as plays, so retain those entries with an explicit unverified flag.
    const preservedHistory = Array.isArray(history) ? history.map(item => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return { title: String(item ?? "Legacy activity"), artist: "Unknown", at: 0, legacyUnverified: true };
      return item.artist === "Local audio" && !item.legacyUnverified
        ? { ...item, legacyUnverified: false }
        : { ...item, legacyUnverified: true };
    }).slice(0, 30) : [];
    const genuineLocalHistory = preservedHistory.filter(item => item && item.artist === "Local audio" && !item.legacyUnverified);
    if (stats && typeof stats === "object" && !Array.isArray(stats)) {
      // Only verified local audio starts count as plays. Historical elapsed time is
      // unverifiable; preserve it separately only if the user exported a prior backup.
      stats.plays = genuineLocalHistory.length;
      stats.seconds = 0;
      stats.days = {};
      stats.lastDay = "";
      try { localStorage.setItem("tf_listener_stats_v1", JSON.stringify(stats)); } catch { /* UI remains usable when storage is blocked. */ }
    }
    if (Array.isArray(history)) {
      try { localStorage.setItem("tf_history_v1", JSON.stringify(preservedHistory)); } catch { /* Ignore a storage error. */ }
    }
    try { trophies = JSON.parse(localStorage.getItem("tf_trophies_v1") || "[]"); } catch { trophies = []; }
    if (Array.isArray(trophies)) {
      const unverifiable = new Set(["first-play", "five-plays", "ten-plays", "one-hour", "collector"]);
      try { localStorage.setItem("tf_trophies_v1", JSON.stringify(trophies.filter(id => !unverifiable.has(id)))); } catch { /* Ignore a storage error. */ }
    }
    try { localStorage.setItem(marker, "1"); } catch { /* Migration can repeat if browser storage is unavailable. */ }
    if (typeof tfRenderListenerHub === "function") tfRenderListenerHub();
    try { window.dispatchEvent(new StorageEvent("storage", { key: "tf_listener_stats_v1" })); } catch { /* Some privacy modes restrict synthetic StorageEvent. */ }
  }

  function safeBackupData() {
    const data = {};
    for (const key of ALLOWED_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw === null) continue;
      try { data[key] = JSON.parse(raw); } catch { /* Ignore corrupt local values rather than exporting broken JSON. */ }
    }
    return data;
  }
  function exportBackup() {
    const backup = { format: "TRAPFARSI_LOCAL_BACKUP", version: 1, exportedAt: new Date().toISOString(), note: "Browser-local app data only. Imported audio files are stored separately in IndexedDB and are not included.", data: safeBackupData() };
    const contents = JSON.stringify(backup, null, 2);
    if (new Blob([contents]).size > MAX_BACKUP_BYTES) { toast12("Backup is larger than 5 MB. Remove excess local community data before exporting."); return; }
    const blob = new Blob([contents], { type: "application/json" }); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `trapfarsi-backup-${new Date().toISOString().slice(0, 10)}.json`; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    const status = $("tf12-backup-status"); if (status) status.textContent = `Backup exported · ${Object.keys(backup.data).length} data groups · ${bytesLabel(blob.size)}.`;
  }
  function validateBackup(parsed) {
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) || parsed.format !== "TRAPFARSI_LOCAL_BACKUP" || parsed.version !== 1 || !parsed.data || typeof parsed.data !== "object" || Array.isArray(parsed.data)) throw new Error("This file is not a supported TRAPFARSI backup.");
    const data = {};
    for (const [key, value] of Object.entries(parsed.data)) {
      if (!ALLOWED_KEYS.has(key)) continue;
      if (ARRAY_KEYS.has(key) && !Array.isArray(value)) throw new Error(`Invalid data format for ${key}. Restore cancelled.`);
      if (OBJECT_KEYS.has(key) && (!value || typeof value !== "object" || Array.isArray(value))) throw new Error(`Invalid data format for ${key}. Restore cancelled.`);
      if (STRING_KEYS.has(key) && typeof value !== "string") throw new Error(`Invalid data format for ${key}. Restore cancelled.`);
      if (!ARRAY_KEYS.has(key) && !OBJECT_KEYS.has(key) && !STRING_KEYS.has(key)) continue;
      data[key] = value;
    }
    if (new Blob([JSON.stringify(data)]).size > MAX_BACKUP_BYTES) throw new Error("The backup exceeds the 5 MB restore limit.");
    return data;
  }
  function injectBackupControls() {
    const page = $("page-profile"); if (!page || $("tf12-backup-panel")) return;
    const section = panel("Your data. Your decision.", "Export or restore the profile, playlists, saved releases, activity, and notes stored by TRAPFARSI in this browser.", "PRIVACY CONTROLS"); section.id = "tf12-backup-panel";
    const note = document.createElement("p"); note.className = "tf12-backup-note"; note.textContent = "Backups include TRAPFARSI localStorage data, not your audio files, Supabase account tokens, or server-side community data. Restoring replaces the app’s local data groups listed in the backup; export your current state first.";
    const actions = document.createElement("div"); actions.className = "tf12-actions";
    actions.append(makeButton("Export local backup", "primary", exportBackup));
    const file = document.createElement("input"); file.type = "file"; file.accept = "application/json,.json"; file.hidden = true; file.id = "tf12-backup-file";
    const importButton = makeButton("Restore from backup", "", () => file.click());
    importButton.setAttribute("aria-describedby", "tf12-backup-warning");
    const warning = document.createElement("p"); warning.id = "tf12-backup-warning"; warning.className = "tf12-backup-note"; warning.textContent = "Restore is destructive for overlapping local data: save a fresh backup before replacing it.";
    const status = document.createElement("p"); status.id = "tf12-backup-status"; status.className = "tf12-status"; status.setAttribute("role", "status"); status.setAttribute("aria-live", "polite");
    file.addEventListener("change", async () => {
      const chosen = file.files?.[0]; if (!chosen) return;
      try {
        if (chosen.size > MAX_BACKUP_BYTES) throw new Error("Backup is larger than 5 MB.");
        const parsed = JSON.parse(await chosen.text()); const data = validateBackup(parsed);
        const total = Object.keys(data).length;
        if (!total) throw new Error("No recognized TRAPFARSI data was found in this backup.");
        if (!confirm(`Restore ${total} local data groups from this backup? This replaces the local app-data snapshot; groups absent from the backup will be removed. Export a fresh backup first if you need to keep current data.`)) return;
        for (const key of ALLOWED_KEYS) if (Object.prototype.hasOwnProperty.call(data, key)) localStorage.setItem(key, JSON.stringify(data[key]));
        // Remove data groups absent from the imported snapshot, so this is a real restore.
        for (const key of ALLOWED_KEYS) if (!Object.prototype.hasOwnProperty.call(data, key)) localStorage.removeItem(key);
        localStorage.removeItem("tf_metric_truth_phase12_v1");
        status.textContent = `Restored ${total} data groups. Reload TRAPFARSI to refresh every screen.`; toast12("Backup restored. Reload the app to apply it everywhere.");
      } catch (error) { status.classList.add("error"); status.textContent = error.message || "Could not restore this backup."; }
      finally { file.value = ""; }
    });
    const clear = makeButton("Clear all local app data", "danger", () => {
      if (!confirm("Clear TRAPFARSI local profiles, playlists, notes, favorites, preferences, and activity on this browser? This cannot be undone. Export a backup first. Persistently saved audio is managed separately.")) return;
      for (const key of [...Object.keys(localStorage)]) if (key.startsWith("tf_")) localStorage.removeItem(key);
      localStorage.removeItem(KEEP_AUDIO_KEY);
      status.textContent = "Local app data cleared. Reload the page to start fresh. Persistent audio files were not changed.";
      toast12("Local app data cleared.");
    });
    actions.append(importButton, clear); section.append(note, actions, file, status);
    const layout = page.querySelector(".profile-layout");
    if (layout) layout.insertAdjacentElement("afterend", section); else page.append(section);
  }

  function injectSleepTimer() {
    const main = $("page-now-playing")?.querySelector(".now-playing-main"); if (!main || $("tf12-sleep-panel")) return;
    const section = panel("Sleep timer", "Pause local playback after a set period, or at the end of the current local track.", "PLAYBACK CONTROL"); section.id = "tf12-sleep-panel";
    const row = document.createElement("div"); row.className = "tf12-timer-row";
    const label = document.createElement("label"); label.textContent = "Pause playback";
    const select = document.createElement("select"); select.id = "tf12-sleep-choice";
    [["5","5 minutes"],["10","10 minutes"],["15","15 minutes"],["30","30 minutes"],["45","45 minutes"],["60","60 minutes"],["end","At end of current track"]].forEach(([value, text]) => { const option = document.createElement("option"); option.value = value; option.textContent = text; select.append(option); });
    label.append(select); const start = makeButton("Start timer", "primary", startSleepTimer); start.id = "tf12-sleep-start"; row.append(label, start);
    const actions = document.createElement("div"); actions.className = "tf12-actions"; const cancel = makeButton("Cancel timer", "", cancelSleepTimer); cancel.id = "tf12-sleep-cancel"; cancel.disabled = true; actions.append(cancel);
    const status = document.createElement("p"); status.id = "tf12-sleep-status"; status.className = "tf12-status"; status.setAttribute("role", "status"); status.setAttribute("aria-live", "polite"); status.textContent = "No sleep timer set.";
    section.append(row, actions, status); const audioTools = main.querySelector(".local-audio-tools");
    if (audioTools) audioTools.insertAdjacentElement("afterend", section); else main.append(section);
    if (typeof tfLocalAudio !== "undefined") tfLocalAudio.addEventListener("ended", () => { if (endOfTrackTimer) finishSleepTimer(); });
  }
  function cancelSleepTimer(silent = false) {
    if (timerTimeout) clearTimeout(timerTimeout); if (timerInterval) clearInterval(timerInterval);
    timerTimeout = null; timerInterval = null; timerDeadline = 0; endOfTrackTimer = false; window.TRAPFARSI_STOP_AT_TRACK_END = false;
    const status = $("tf12-sleep-status"); if (status) status.textContent = "No sleep timer set.";
    const cancel = $("tf12-sleep-cancel"); if (cancel) cancel.disabled = true;
    const start = $("tf12-sleep-start"); if (start) start.disabled = false;
    if (!silent) toast12("Sleep timer cancelled.");
  }
  function finishSleepTimer() {
    cancelSleepTimer(true);
    if (typeof tfLocalAudio !== "undefined") tfLocalAudio.pause();
    if (typeof tfPlayer !== "undefined") tfPlayer.playing = false;
    if (typeof tfRenderPlayer === "function") tfRenderPlayer();
    const status = $("tf12-sleep-status"); if (status) status.textContent = "Timer finished. Playback paused.";
    toast12("Sleep timer finished. Playback paused.");
  }
  function startSleepTimer() {
    cancelSleepTimer(true);
    const choice = $("tf12-sleep-choice")?.value || "15";
    if (choice === "end") {
      if (typeof tfLocalMode === "undefined" || !tfLocalMode || !tfPlayer.queue.length) { const status = $("tf12-sleep-status"); if (status) { status.classList.add("error"); status.textContent = "Import or select a local audio track to use end-of-track timing."; } return; }
      endOfTrackTimer = true;
      window.TRAPFARSI_STOP_AT_TRACK_END = true;
      const status = $("tf12-sleep-status"); if (status) status.textContent = "Will pause when the current local track ends.";
    } else {
      const minutes = Math.max(1, Math.min(180, Number(choice) || 15)); timerDeadline = Date.now() + minutes * 60 * 1000;
      const update = () => {
        const remaining = Math.max(0, timerDeadline - Date.now());
        const status = $("tf12-sleep-status"); if (status) status.textContent = remaining > 0 ? `Playback will pause in ${Math.ceil(remaining / 60000)} min ${String(Math.floor((remaining % 60000) / 1000)).padStart(2,"0")} sec.` : "Timer finished. Playback paused.";
        if (remaining <= 0) finishSleepTimer();
      };
      timerTimeout = setTimeout(finishSleepTimer, minutes * 60 * 1000); timerInterval = setInterval(update, 1000); update();
    }
    const cancel = $("tf12-sleep-cancel"); if (cancel) cancel.disabled = false;
    const start = $("tf12-sleep-start"); if (start) start.disabled = false;
    toast12("Sleep timer set.");
  }

  function correctDemoPlaybackAndAnalytics() {
    if (typeof renderAlbum === "function" && typeof tfPlayer !== "undefined") {
      const originalRenderAlbum = renderAlbum;
      renderAlbum = function(album) {
        const preserveLocalAudio = Boolean(tfLocalMode && tfPlayer.queue?.some(track => track.url));
        const localQueue = preserveLocalAudio ? tfPlayer.queue.map(track => ({ ...track })) : null;
        const localIndex = tfPlayer.trackIndex;
        originalRenderAlbum(album);
        if (!preserveLocalAudio) return;
        tfPlayer.queue = localQueue;
        tfPlayer.trackIndex = Math.min(localIndex, Math.max(0, localQueue.length - 1));
        tfPlayer.seconds = Number(tfLocalAudio.currentTime) || 0;
        tfPlayer.duration = Number.isFinite(tfLocalAudio.duration) ? tfLocalAudio.duration : tfPlayer.duration;
        tfPlayer.playing = !tfLocalAudio.paused;
        // Album cards contain demo metadata, not streamable track files. Keep the current
        // local queue intact and disable these misleading demo playback controls.
        const preview = $("album-play");
        if (preview) {
          const replacement = preview.cloneNode(true);
          replacement.disabled = true;
          replacement.textContent = "Demo only · no stream";
          replacement.title = "Import and play local audio from Now Playing";
          preview.replaceWith(replacement);
        }
        document.querySelectorAll("#album-track-list .album-track-row").forEach(button => {
          const replacement = button.cloneNode(true);
          replacement.addEventListener("click", () => toast12("This catalogue track has no audio stream. Your imported local queue remains available in Now Playing."));
          button.replaceWith(replacement);
        });
        const note = document.querySelector(".album-detail-footnote");
        if (note) note.textContent = "DEMO METADATA ONLY · YOUR LOCAL AUDIO CONTINUES PLAYING IN THE PLAYER";
        if (typeof tfRenderPlayer === "function") tfRenderPlayer();
      };
    }
    if (typeof tfRenderPlayer === "function" && typeof tfPlayer !== "undefined") {
      const originalRenderPlayer = tfRenderPlayer;
      tfRenderPlayer = function() {
        originalRenderPlayer();
        if (tfLocalMode && tfPlayer.queue?.length) {
          const track = tfPlayer.queue[tfPlayer.trackIndex] || {};
          const title = track.title || track.fileName || "Local audio";
          const artist = track.fileName ? `LOCAL AUDIO · ${track.fileName}` : "LOCAL AUDIO · THIS DEVICE";
          if ($("np-title")) $("np-title").textContent = title;
          if ($("np-artist")) $("np-artist").textContent = artist;
          if ($("mini-title")) $("mini-title").textContent = title;
          if ($("mini-artist")) $("mini-artist").textContent = "LOCAL AUDIO · THIS DEVICE";
          if ($("np-art")) $("np-art").src = "./icon.svg";
          if ($("mini-art")) $("mini-art").src = "./icon.svg";
          document.querySelectorAll("#np-queue-list .np-queue-row").forEach((row, index) => {
            const queued = tfPlayer.queue[index] || {};
            const cover = row.querySelector("img");
            if (cover) { cover.src = "./icon.svg"; cover.alt = "Local audio"; }
            const meta = row.querySelector("span");
            if (meta) meta.textContent = `LOCAL AUDIO · ${queued.fileName || "THIS DEVICE"}`;
          });
        }
      };
      if (typeof tfLocalAudio !== "undefined") tfLocalAudio.addEventListener("loadedmetadata", () => {
        if (!tfLocalMode || !Number.isFinite(tfLocalAudio.duration)) return;
        tfPlayer.duration = tfLocalAudio.duration;
        const queued = tfPlayer.queue?.[tfPlayer.trackIndex];
        if (queued) queued.duration = tfLocalAudio.duration;
        tfRenderPlayer();
      });
    }
    if (typeof tfPlayTrack === "function" && typeof tfPlayer !== "undefined") {
      tfPlayTrack = function(index) {
        if (tfLocalMode && typeof tfPlayLocalTrack === "function") { tfPlayLocalTrack(index); return; }
        tfPlayer.queue = typeof tfTracks === "function" ? tfTracks(tfPlayer.album) : [];
        tfPlayer.trackIndex = tfPlayer.queue.length ? ((Number(index) || 0) + tfPlayer.queue.length) % tfPlayer.queue.length : 0;
        tfPlayer.playing = false; tfPlayer.seconds = 0;
        if (tfPlayer.queue[tfPlayer.trackIndex]) tfPlayer.duration = tfPlayer.queue[tfPlayer.trackIndex].duration || 0;
        if (typeof tfRenderPlayer === "function") tfRenderPlayer();
        toast12("This catalogue entry is demonstration metadata, not an audio stream. Import local audio to listen here.");
      };
    }
    if (typeof tfTogglePlayback === "function" && typeof tfPlayer !== "undefined") {
      const previousToggle = tfTogglePlayback;
      tfTogglePlayback = function() {
        if (!tfLocalMode) {
          tfPlayer.playing = false;
          if (typeof tfRenderPlayer === "function") tfRenderPlayer();
          toast12("The demo catalogue has no playable streams yet. Import local audio to use the player.");
          return;
        }
        previousToggle();
      };
    }
    if (typeof tfLogPlay === "function" && typeof tfLocalAudio !== "undefined") {
      const recordRealPlay = tfLogPlay;
      tfLogPlay = function() { /* Track starts are recorded only after an actual local audio source begins playing. */ };
      tfLocalAudio.addEventListener("ended", () => { lastCountedAudioSource = ""; });
      tfLocalAudio.addEventListener("playing", () => {
        const track = tfPlayer.queue?.[tfPlayer.trackIndex];
        const source = tfLocalAudio.currentSrc || tfLocalAudio.src || "";
        if (!source || source === lastCountedAudioSource) return;
        lastCountedAudioSource = source;
        recordRealPlay(track?.title || "Local audio", "Local audio");
      });
    }
  }
  function init() {
    correctLegacyDemoMetrics();
    injectAudioControls(); injectSleepTimer(); injectBackupControls(); correctDemoPlaybackAndAnalytics();
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.addEventListener("controllerchange", () => { /* New shell is active; reload remains user-controlled. */ }, { once: true });
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
})();
