/* TRAPFARSI Phase 10 — Discovery Lab + Music DNA
 * Uses only catalogue metadata and listening data already stored in this browser.
 * No remote streaming claims, fabricated listening statistics, or hidden uploads.
 */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const HISTORY_KEY = "tf_history_v1";
  const STATS_KEY = "tf_listener_stats_v1";
  const FAV_KEY = "tf_favorites_v1";
  const FOLLOW_KEY = "tf_following_v1";
  const MOOD_KEY = "tf_discovery_mood_v1";
  const strings = {
    en: { eyebrow:"DISCOVERY, WITHOUT THE NOISE", title:"Find your frequency.", intro:"Choose a feeling. Explore the catalogue through your own lens.", local:"DISCOVERY LAB · LOCAL", tune:"Tune your mood", catalogue:"Recommendations are drawn from the visible demo catalogue.", worth:"Worth a closer listen", selected:"Selected for", all:"Open ears", allDesc:"A little of everything", rap:"Bars & bass", rapDesc:"Rap, hip-hop, sharp writing", late:"After hours", lateDesc:"R&B and nocturnal sounds", guitar:"Guitar weather", guitarDesc:"Rock and alternative edges", reflect:"Inner world", reflectDesc:"Introspective and atmospheric", explore:"Explore", noItems:"No catalogue items are available yet. Add releases to the local catalogue to power discovery.", disclaimer:"Editorial/demo catalogue · not a streaming chart", browse:"Browse all releases ↗", dna:"Your Music DNA", dnaSub:"A snapshot of your real activity on this device.", shape:"Your taste, taking shape.", emptyDNA:"Your listening identity starts with what you choose to play, save and follow. These numbers will update from your activity on this device.", activeDNA:"Built from this browser's recorded listening activity, saved releases and followed artists. More activity makes this snapshot more representative.", starts:"Track starts", saved:"Saved releases", followed:"Artists followed", noHistory:"No listening history yet. Start a local track to begin building your Music DNA.", history:"Recent history contains", recorded:"recorded track starts.", private:"Private by default", profile:"Open listener profile ↗", metricNote:"Profile completeness measures available activity signals; it is not a rating of your taste. Data stays in this browser." },
    ru: { eyebrow:"ОТКРЫВАЙ МУЗЫКУ БЕЗ ШУМА", title:"Найди свою частоту.", intro:"Выбери настроение и исследуй каталог по-своему.", local:"ЛАБОРАТОРИЯ · ЛОКАЛЬНО", tune:"Выбери настроение", catalogue:"Рекомендации формируются из демонстрационного каталога.", worth:"Стоит послушать внимательнее", selected:"Подборка для", all:"Открытый слух", allDesc:"Понемногу обо всём", rap:"Ритм и бас", rapDesc:"Рэп, хип-хоп и сильные тексты", late:"После полуночи", lateDesc:"R&B и ночное настроение", guitar:"Гитарный вайб", guitarDesc:"Рок и альтернативное звучание", reflect:"Внутренний мир", reflectDesc:"Рефлексивная и атмосферная музыка", explore:"Открыть", noItems:"Каталог пока пуст. Добавь релизы в локальную коллекцию.", disclaimer:"Демо-каталог · не музыкальный чарт", browse:"Все релизы ↗", dna:"Твоя музыкальная ДНК", dnaSub:"Снимок реальной активности на этом устройстве.", shape:"Твой вкус формируется.", emptyDNA:"Музыкальная идентичность начинается с того, что ты слушаешь, сохраняешь и на кого подписываешься.", activeDNA:"Основано на истории прослушиваний, сохранённых релизах и подписках в этом браузере.", starts:"Запуски треков", saved:"Сохранённые релизы", followed:"Подписки на артистов", noHistory:"Истории пока нет. Включи локальный трек, чтобы начать собирать Music DNA.", history:"В истории", recorded:"запусков треков.", private:"По умолчанию приватно", profile:"Профиль слушателя ↗", metricNote:"Полнота профиля отражает объём данных, а не качество музыкального вкуса. Данные остаются в браузере." },
    fa: { eyebrow:"کشف موسیقی، بدون هیاهو", title:"فرکانس خودت را پیدا کن.", intro:"یک حال‌وهوا انتخاب کن و کاتالوگ را با نگاه خودت بگرد.", local:"آزمایشگاه کشف · محلی", tune:"حال‌وهوایت را تنظیم کن", catalogue:"پیشنهادها از کاتالوگ نمایشی موجود انتخاب می‌شوند.", worth:"ارزش یک بار شنیدن دقیق‌تر", selected:"پیشنهاد برای", all:"گوش باز", allDesc:"کمی از همه‌چیز", rap:"بار و بیس", rapDesc:"رپ، هیپ‌هاپ و نوشتار قوی", late:"بعد از نیمه‌شب", lateDesc:"آراندبی و حال‌وهوای شبانه", guitar:"هوای گیتار", guitarDesc:"راک و آلترناتیو", reflect:"جهان درون", reflectDesc:"موسیقی تأملی و فضاساز", explore:"بررسی", noItems:"هنوز موردی در کاتالوگ نیست. برای فعال شدن کشف، ریلیزهای محلی اضافه کن.", disclaimer:"کاتالوگ نمایشی · نه جدول پخش زنده", browse:"دیدن همه ریلیزها ↗", dna:"دی‌ان‌ای موسیقایی تو", dnaSub:"نمایی از فعالیت واقعی تو روی این دستگاه.", shape:"سلیقه‌ات در حال شکل‌گیری است.", emptyDNA:"هویت موسیقایی تو از انتخاب‌هایی که پخش، ذخیره و دنبال می‌کنی شکل می‌گیرد.", activeDNA:"بر پایه تاریخچه پخش، ریلیزهای ذخیره‌شده و هنرمندان دنبال‌شده در همین مرورگر.", starts:"شروع پخش", saved:"ریلیز ذخیره‌شده", followed:"هنرمند دنبال‌شده", noHistory:"هنوز تاریخچه‌ای نیست. یک فایل محلی پخش کن تا دی‌ان‌ای موسیقایی شکل بگیرد.", history:"تاریخچه شامل", recorded:"شروع پخش ثبت‌شده است.", private:"به‌صورت پیش‌فرض خصوصی", profile:"رفتن به پروفایل شنونده ↗", metricNote:"کامل بودن پروفایل میزان داده موجود را نشان می‌دهد، نه کیفیت سلیقه موسیقی. داده‌ها در همین مرورگر می‌مانند." }
  };
  const currentLang = () => (window.tfI18n && strings[window.tfI18n.getLang()]) ? window.tfI18n.getLang() : "en";
  const tr = key => strings[currentLang()][key] || strings.en[key] || key;
  const moods = [
    { id: "all", key: "all", desc: "allDesc", terms: [] },
    { id: "rap", key: "rap", desc: "rapDesc", terms: ["rap", "hip-hop", "hip hop", "trap"] },
    { id: "late", key: "late", desc: "lateDesc", terms: ["r&b", "rnb", "soul", "alternative"] },
    { id: "guitar", key: "guitar", desc: "guitarDesc", terms: ["rock", "alternative", "progressive"] },
    { id: "reflect", key: "reflect", desc: "reflectDesc", terms: ["alternative", "r&b", "soul", "hip-hop"] }
  ];
  const read = (key, fallback) => { try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch { return fallback; } };
  const safe = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  function styles() {
    if ($("tf-phase10-style")) return;
    const style = document.createElement("style"); style.id = "tf-phase10-style";
    style.textContent = `
.tf-discovery-lab{margin:44px 0 24px}.tf-lab-head{display:flex;align-items:end;justify-content:space-between;gap:18px;margin-bottom:16px}.tf-lab-head h2{margin:5px 0;font:800 clamp(24px,3vw,34px)/1.1 Manrope,Inter,sans-serif;letter-spacing:-1.2px}.tf-lab-head p{margin:0;color:#858b96;font-size:12px;line-height:1.7}.tf-lab-layout{display:grid;grid-template-columns:1.15fr .85fr;gap:14px}.tf-lab-panel{min-width:0;padding:22px;border-radius:24px}.tf-mood-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:18px 0}.tf-mood{min-height:84px;text-align:left;padding:13px;border:1px solid #d7dbe4;border-radius:16px;background:#ffffff78;cursor:pointer;transition:transform .2s,border-color .2s,background .2s}.tf-mood:hover{transform:translateY(-2px)}.tf-mood[aria-pressed=true]{border-color:#879b70;background:#eaf0e3}.tf-mood strong,.tf-mood small{display:block}.tf-mood strong{font-size:12px}.tf-mood small{font-size:10px;color:#858b96;margin-top:6px;line-height:1.5}.tf-lab-results{display:grid;gap:8px}.tf-lab-result{display:grid;grid-template-columns:42px minmax(0,1fr) auto;align-items:center;gap:10px;padding:10px;border-top:1px solid #d7dbe255}.tf-lab-result img{width:42px;height:42px;border-radius:11px;object-fit:cover}.tf-lab-result strong,.tf-lab-result small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tf-lab-result strong{font-size:11px}.tf-lab-result small{font-size:10px;color:#858b96;margin-top:4px}.tf-lab-result button{border:1px solid #d2d6dd;background:#f5f6f8;border-radius:999px;padding:8px 10px;font-size:10px;font-weight:700;cursor:pointer}.tf-dna-score{display:grid;grid-template-columns:100px 1fr;align-items:center;gap:16px;margin:18px 0}.tf-dna-ring{width:100px;height:100px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(#83966b var(--dna-fill,0%),#e1e4e9 0);position:relative}.tf-dna-ring:before{content:"";position:absolute;inset:8px;border-radius:50%;background:#f7f8fa}.tf-dna-ring span{position:relative;font:800 20px Manrope,Inter,sans-serif}.tf-dna-score h3{font-size:14px;margin:0 0 6px}.tf-dna-score p{font-size:10px;line-height:1.7;color:#858b96;margin:0}.tf-dna-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.tf-dna-metric{padding:12px 9px;border-radius:14px;background:#ffffff76;border:1px solid #d7dbe455}.tf-dna-metric strong{display:block;font:800 20px Manrope,Inter,sans-serif}.tf-dna-metric span{display:block;color:#858b96;font-size:9px;margin-top:5px}.tf-dna-note{margin:13px 0 0;color:#858b96;font-size:10px;line-height:1.7}.tf-lab-empty{padding:14px;border-radius:14px;color:#858b96;background:#ffffff65;font-size:11px;line-height:1.7}.tf-lab-footer{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:12px;color:#858b96;font-size:10px}.tf-lab-footer button{border:0;background:transparent;text-decoration:underline;cursor:pointer;color:inherit;font:inherit}.tf-lab-result button:focus-visible,.tf-mood:focus-visible{outline:3px solid #8da8d9;outline-offset:3px}
html.tf-night .tf-mood,html.tf-night .tf-dna-metric,html.tf-night .tf-lab-empty{background:rgba(255,255,255,.035);border-color:rgba(255,255,255,.1);color:#dbe0e8}html.tf-night .tf-mood[aria-pressed=true]{background:rgba(132,153,108,.18);border-color:#84996c}html.tf-night .tf-lab-result button{background:#252b35;border-color:#424956;color:#f2f4f7}html.tf-night .tf-dna-ring:before{background:#1c2028}html.tf-night .tf-dna-ring{background:conic-gradient(#9bb184 var(--dna-fill,0%),#343a45 0)}
@media(max-width:760px){.tf-lab-layout{grid-template-columns:1fr}.tf-lab-panel{padding:16px}.tf-lab-head{align-items:start;flex-direction:column}.tf-dna-score{grid-template-columns:84px 1fr}.tf-dna-ring{width:84px;height:84px}.tf-mood{min-height:78px}}
@media(prefers-reduced-motion:reduce){.tf-mood{transition:none}}
`;
    document.head.append(style);
  }

  function renderedReleases() {
    return [...document.querySelectorAll("#release-grid .release-card")].map(card => {
      const img = card.querySelector("img");
      return { title: card.querySelector(".release-card-title")?.textContent?.trim() || "Untitled release", artist: card.querySelector(".release-card-artist")?.textContent?.trim() || "Unknown artist", meta: card.querySelector(".release-card-foot")?.textContent?.trim() || "", art: img?.getAttribute("src") || "./icon.svg", card };
    });
  }
  function getCurrentMood() { const value = read(MOOD_KEY, "all"); return moods.some(m => m.id === value) ? value : "all"; }
  function renderDiscovery() {
    const result = $("tf-lab-results"); if (!result) return;
    const mood = moods.find(m => m.id === getCurrentMood()) || moods[0];
    const all = renderedReleases();
    const matching = mood.terms.length ? all.filter(x => mood.terms.some(term => (x.meta + " " + x.artist + " " + x.title).toLowerCase().includes(term))) : all;
    const chosen = (matching.length ? matching : all).slice(0, 3);
    result.replaceChildren();
    if (!chosen.length) {
      const empty = document.createElement("div"); empty.className = "tf-lab-empty"; empty.textContent = tr("noItems"); result.append(empty);
    } else chosen.forEach(item => {
      const row = document.createElement("div"); row.className = "tf-lab-result";
      const img = document.createElement("img"); img.src = item.art; img.alt = ""; img.loading = "lazy";
      const copy = document.createElement("div"); const title = document.createElement("strong"); title.textContent = item.title; const meta = document.createElement("small"); meta.textContent = item.artist + (item.meta ? " · " + item.meta : ""); copy.append(title, meta);
      const button = document.createElement("button"); button.type = "button"; button.textContent = tr("explore"); button.setAttribute("aria-label", "Explore " + item.title); button.addEventListener("click", () => { location.hash = "releases"; setTimeout(() => item.card?.click(), 80); });
      row.append(img, copy, button); result.append(row);
    });
    $("tf-lab-active-mood").textContent = tr(mood.key);
    document.querySelectorAll(".tf-mood").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.mood === mood.id)));
  }
  function renderDNA() {
    const history = read(HISTORY_KEY, []), stats = read(STATS_KEY, { plays: 0, seconds: 0 }), favorites = read(FAV_KEY, []), following = read(FOLLOW_KEY, []);
    const plays = Math.max(0, Number(stats.plays) || 0), seconds = Math.max(0, Number(stats.seconds) || 0);
    const completeness = Math.min(100, Math.round((Math.min(plays, 10) / 10 * 45) + (Math.min(favorites.length, 5) / 5 * 30) + (Math.min(following.length, 3) / 3 * 25)));
    $("tf-dna-ring").style.setProperty("--dna-fill", completeness + "%"); $("tf-dna-percent").textContent = completeness + "%";
    $("tf-dna-plays").textContent = String(plays); $("tf-dna-favs").textContent = String(favorites.length); $("tf-dna-following").textContent = String(following.length);
    const copy = $("tf-dna-summary");
    if (!plays && !favorites.length && !following.length) copy.textContent = tr("emptyDNA");
    else copy.textContent = tr("activeDNA");
    $("tf-dna-history-note").textContent = history.length ? tr("history") + " " + history.length + " " + tr("recorded") : tr("noHistory");
  }
  function translate() {
    const assign = (id, key) => { const node = $(id); if (node) node.textContent = tr(key); };
    assign("tf-lab-eyebrow", "eyebrow"); assign("tf-lab-title", "title"); assign("tf-lab-intro", "intro"); assign("tf-lab-local", "local"); assign("tf-mood-title", "tune"); assign("tf-lab-catalogue", "catalogue"); assign("tf-lab-worth", "worth"); assign("tf-lab-selected", "selected"); assign("tf-lab-disclaimer", "disclaimer"); assign("tf-lab-all", "browse"); assign("tf-dna-title", "dna"); assign("tf-dna-sub", "dnaSub"); assign("tf-dna-shape", "shape"); assign("tf-dna-plays-label", "starts"); assign("tf-dna-favs-label", "saved"); assign("tf-dna-following-label", "followed"); assign("tf-dna-metric-note", "metricNote"); assign("tf-dna-private", "private"); assign("tf-dna-profile", "profile");
    document.querySelectorAll("[data-mood-label]").forEach(node => { node.textContent = tr(node.dataset.moodLabel); });
    renderDiscovery(); renderDNA();
  }
  function mount() {
    if (!$("page-home") || $("tf-discovery-lab")) return;
    styles();
    const section = document.createElement("section"); section.id = "tf-discovery-lab"; section.className = "tf-discovery-lab";
    section.innerHTML = `<div class="tf-lab-head"><div><div class="eyebrow" id="tf-lab-eyebrow"></div><h2 id="tf-lab-title"></h2><p id="tf-lab-intro"></p></div><span class="pill" id="tf-lab-local"></span></div><div class="tf-lab-layout"><section class="tf-lab-panel glass" aria-labelledby="tf-mood-title"><div class="tf-feature-panel-head"><div><h3 id="tf-mood-title"></h3><p id="tf-lab-catalogue"></p></div><span>⌁</span></div><div class="tf-mood-grid">${moods.map(m => `<button type="button" class="tf-mood" data-mood="${m.id}" aria-pressed="false"><strong data-mood-label="${m.key}"></strong><small data-mood-label="${m.desc}"></small></button>`).join("")}</div><div class="tf-feature-panel-head"><div><h3 id="tf-lab-worth"></h3><p><span id="tf-lab-selected"></span> <strong id="tf-lab-active-mood"></strong></p></div></div><div class="tf-lab-results" id="tf-lab-results" aria-live="polite"></div><div class="tf-lab-footer"><span id="tf-lab-disclaimer"></span><button type="button" id="tf-lab-all"></button></div></section><section class="tf-lab-panel glass" aria-labelledby="tf-dna-title"><div class="tf-feature-panel-head"><div><h3 id="tf-dna-title"></h3><p id="tf-dna-sub"></p></div><span>◉</span></div><div class="tf-dna-score"><div class="tf-dna-ring" id="tf-dna-ring" role="img" aria-label="Music DNA profile completeness"><span id="tf-dna-percent">0%</span></div><div><h3 id="tf-dna-shape"></h3><p id="tf-dna-summary"></p></div></div><div class="tf-dna-metrics"><div class="tf-dna-metric"><strong id="tf-dna-plays">0</strong><span id="tf-dna-plays-label"></span></div><div class="tf-dna-metric"><strong id="tf-dna-favs">0</strong><span id="tf-dna-favs-label"></span></div><div class="tf-dna-metric"><strong id="tf-dna-following">0</strong><span id="tf-dna-following-label"></span></div></div><p class="tf-dna-note" id="tf-dna-history-note"></p><p class="tf-dna-note" id="tf-dna-metric-note"></p><div class="tf-lab-footer"><span id="tf-dna-private"></span><button type="button" id="tf-dna-profile"></button></div></section></div>`;
    const before = $("tf-listener-hub") || document.querySelector("#page-home .bottom-callout");
    if (before) before.insertAdjacentElement("beforebegin", section); else $("page-home").append(section);
    section.querySelectorAll("[data-mood]").forEach(button => button.addEventListener("click", () => { localStorage.setItem(MOOD_KEY, button.dataset.mood); renderDiscovery(); }));
    $("tf-lab-all").addEventListener("click", () => { location.hash = "releases"; });
    $("tf-dna-profile").addEventListener("click", () => { location.hash = "profile"; });
    window.addEventListener("storage", event => { if ([HISTORY_KEY, STATS_KEY, FAV_KEY, FOLLOW_KEY].includes(event.key)) renderDNA(); });
    translate(); renderDiscovery(); renderDNA();
    window.addEventListener("tf:lang", translate);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) { renderDiscovery(); renderDNA(); } });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
