/* TRAPFARSI i18n — English · Русский · فارسی
 * RTL for Persian. Persists choice. Re-applies after dynamic renders.
 */
(() => {
  "use strict";
  const LANG_KEY = "tf_lang_v1";
  const supported = ["en", "ru", "fa"];
  let lang = localStorage.getItem(LANG_KEY) || "en";
  if (!supported.includes(lang)) lang = "en";

  const dict = {
    en: {
      brand_tag: "Music, with intention",
      nav_home: "Discover",
      nav_releases: "New releases",
      nav_artists: "Artists",
      nav_library: "Library",
      nav_search: "Search",
      nav_community: "Discussion",
      nav_profile: "Profile",
      nav_lyrics: "Lyrics",
      nav_now: "Now playing",
      m_home: "Home",
      m_releases: "Releases",
      m_artists: "Artists",
      m_library: "Library",
      m_search: "Search",
      // Home / discovery
      mood_persian: "Persian Trap",
      mood_late: "Late night",
      mood_new: "New drops",
      mood_discuss: "Discussion",
      mood_lyrics: "Lyrics room",
      mood_library: "Your library",
      // Player modes
      mode_dock: "Dock",
      mode_mini: "Mini",
      mode_stage: "Stage",
      nothing_playing: "Nothing playing",
      local_audio: "Local audio",
      up_next: "UP NEXT",
      queue_empty: "Queue is empty — open a release or import audio.",
      volume: "VOLUME",
      share_room: "Share to room",
      share_discuss: "Share to discussion",
      draft_ready: "Draft ready — publish to the public room.",
      listening_to: "Listening to",
      what_rotation: "What's in your rotation?",
      presence_idle: "Share what you're hearing with the room",
      presence_sub: "public discussion",
      // Lyrics
      lyrics_eyebrow: "LYRICS · GLASS ROOM",
      lyrics_empty: "No lyrics yet.\nWrite a line per phrase below — they'll light up in this glass stage while you listen.",
      lyrics_label: "Write or paste lyrics / notes (one line per phrase)",
      lyrics_save: "Save lyrics",
      lyrics_preview: "Preview lines",
      lyrics_status: "Saved locally per track · no copyrighted fetch",
      lyrics_placeholder: "One lyric line per row…\nYour own words, translations, or listening notes.",
      // Community
      discuss_title: "Public discussion room",
      discuss_copy: "Open conversations — not DMs. Share takes on Persian trap, US rap, R&B, and new drops. Everyone in the room can read and reply.",
      discuss_start: "Start a post",
      community_h1: "Talk about the sound.",
      community_p: "Start conversations around US rap, Persian rap, R&B, rock, and new releases.",
      channel: "CHANNEL",
      your_post: "YOUR POST",
      post_placeholder: "Start a music conversation…",
      publish: "Publish post",
      feed: "Community feed",
      all_topics: "All topics",
      community_note: "With Supabase configured, sign in to publish posts visible to other listeners. Without it, posts remain a local preview.",
      // Profile
      profile_h1: "Your profile.",
      profile_p: "Manage your listener identity and personal playlists on this device.",
      display_name: "DISPLAY NAME",
      bio: "BIO",
      save_profile: "Save profile",
      profile_note: "Prototype: profile and playlists are saved in this browser, not synced to an account.",
      your_playlists: "Your playlists",
      playlist_hint: "Add the current track or remove tracks at any time.",
      playlist_name: "Playlist name",
      create: "＋ Create",
      // Auth / cloud
      account_sync: "ACCOUNT & SYNC",
      make_library: "Make your library yours.",
      sign_in_copy: "Sign in by email to sync your profile and playlists across devices and join the shared community.",
      email_link: "Email me a sign-in link",
      // Player chrome
      import_audio: "＋ Import audio files",
      import_note: "Import audio files from your device. Files stay on your device.",
      add_playlist: "＋ Add to playlist",
      open_community: "Community ↗",
      open_lyrics: "Lyrics & notes ↗",
      // Theme / lang
      night: "Night glass",
      light: "Light mode",
      lang: "Language",
      // Hotkeys
      hotkeys: "Shortcuts",
      hotkeys_body: "Space play/pause · ← → skip · L lyrics · C discussion · N night mode · ? help",
      // Footer
      footer_phase: "PHASE 08 / STUDIO MAX",
      best_build: "BEST BUILD",
      // Follow / profiles
      follow: "＋ Follow",
      following: "Following ✓",
      followers: "Followers",
      following_label: "Following",
      posts: "Posts",
      your_profile: "Your profile",
      sign_in_follow: "Sign in to follow",
      close: "Close",
      no_bio: "No public bio yet.",
      load_fail: "Could not load this profile.",
      // Common
      save: "Save",
      edit: "Edit",
      delete: "Delete",
      like: "♡ Like",
      liked: "♥ Liked",
      report: "Report",
      reply: "Reply",
      conversation: "Conversation",
      shared: "SHARED COMMUNITY",
      nothing_selected: "Nothing selected",
      choose_track: "Choose a track in the player.",
      // Releases / search placeholders used dynamically
      search_ph: "Search artists, releases, genres…",
      toast_saved: "Saved",
      lang_en: "English",
      lang_ru: "Русский",
      lang_fa: "فارسی"
    },
    ru: {
      brand_tag: "Музыка с намерением",
      nav_home: "Обзор",
      nav_releases: "Новинки",
      nav_artists: "Артисты",
      nav_library: "Библиотека",
      nav_search: "Поиск",
      nav_community: "Обсуждение",
      nav_profile: "Профиль",
      nav_lyrics: "Текст",
      nav_now: "Сейчас играет",
      m_home: "Главная",
      m_releases: "Релизы",
      m_artists: "Артисты",
      m_library: "Библиотека",
      m_search: "Поиск",
      mood_persian: "Persian Trap",
      mood_late: "Поздняя ночь",
      mood_new: "Новые дропы",
      mood_discuss: "Обсуждение",
      mood_lyrics: "Комната текстов",
      mood_library: "Ваша библиотека",
      mode_dock: "Док",
      mode_mini: "Мини",
      mode_stage: "Сцена",
      nothing_playing: "Ничего не играет",
      local_audio: "Локальное аудио",
      up_next: "ДАЛЬШЕ",
      queue_empty: "Очередь пуста — откройте релиз или импортируйте аудио.",
      volume: "ГРОМКОСТЬ",
      share_room: "В обсуждение",
      share_discuss: "Поделиться в обсуждении",
      draft_ready: "Черновик готов — опубликуйте в общей комнате.",
      listening_to: "Слушаю",
      what_rotation: "Что у вас в ротации?",
      presence_idle: "Поделитесь тем, что слушаете",
      presence_sub: "открытое обсуждение",
      lyrics_eyebrow: "ТЕКСТ · GLASS ROOM",
      lyrics_empty: "Текста пока нет.\nПишите по строке — они будут подсвечиваться на сцене во время прослушивания.",
      lyrics_label: "Напишите или вставьте текст / заметки (одна строка — одна фраза)",
      lyrics_save: "Сохранить текст",
      lyrics_preview: "Показать строки",
      lyrics_status: "Сохраняется локально на трек · без загрузки чужих текстов",
      lyrics_placeholder: "Одна строка текста в ряд…\nСвои слова, перевод или заметки.",
      discuss_title: "Открытая комната обсуждений",
      discuss_copy: "Публичные разговоры — не личные сообщения. Делитесь мнениями о Persian trap, US rap, R&B и новинках. Все в комнате могут читать и отвечать.",
      discuss_start: "Написать пост",
      community_h1: "Говорим о звуке.",
      community_p: "Обсуждайте US rap, Persian rap, R&B, рок и новые релизы.",
      channel: "КАНАЛ",
      your_post: "ВАШ ПОСТ",
      post_placeholder: "Начните музыкальный разговор…",
      publish: "Опубликовать",
      feed: "Лента сообщества",
      all_topics: "Все темы",
      community_note: "С Supabase войдите, чтобы посты видели другие слушатели. Без него — локальный предпросмотр.",
      profile_h1: "Ваш профиль.",
      profile_p: "Управляйте именем слушателя и плейлистами на этом устройстве.",
      display_name: "ИМЯ",
      bio: "О СЕБЕ",
      save_profile: "Сохранить профиль",
      profile_note: "Прототип: профиль и плейлисты хранятся в этом браузере.",
      your_playlists: "Ваши плейлисты",
      playlist_hint: "Добавляйте текущий трек или удаляйте треки в любой момент.",
      playlist_name: "Название плейлиста",
      create: "＋ Создать",
      account_sync: "АККАУНТ И СИНХРОНИЗАЦИЯ",
      make_library: "Сделайте библиотеку своей.",
      sign_in_copy: "Войдите по email, чтобы синхронизировать профиль и плейлисты и участвовать в сообществе.",
      email_link: "Прислать ссылку для входа",
      import_audio: "＋ Импорт аудио",
      import_note: "Файлы остаются на вашем устройстве.",
      add_playlist: "＋ В плейлист",
      open_community: "Обсуждение ↗",
      open_lyrics: "Текст и заметки ↗",
      night: "Ночной режим",
      light: "Светлый режим",
      lang: "Язык",
      hotkeys: "Горячие клавиши",
      hotkeys_body: "Пробел — play/pause · ← → — трек · L — текст · C — обсуждение · N — ночь · ? — справка",
      footer_phase: "ФАЗА 08 / STUDIO MAX",
      best_build: "ЛУЧШАЯ СБОРКА",
      follow: "＋ Подписаться",
      following: "Вы подписаны ✓",
      followers: "Подписчики",
      following_label: "Подписки",
      posts: "Посты",
      your_profile: "Ваш профиль",
      sign_in_follow: "Войдите, чтобы подписаться",
      close: "Закрыть",
      no_bio: "Пока нет описания.",
      load_fail: "Не удалось загрузить профиль.",
      save: "Сохранить",
      edit: "Изменить",
      delete: "Удалить",
      like: "♡ Нравится",
      liked: "♥ Нравится",
      report: "Жалоба",
      reply: "Ответить",
      conversation: "Диалог",
      shared: "ОБЩЕЕ СООБЩЕСТВО",
      nothing_selected: "Ничего не выбрано",
      choose_track: "Выберите трек в плеере.",
      search_ph: "Поиск артистов, релизов, жанров…",
      toast_saved: "Сохранено",
      lang_en: "English",
      lang_ru: "Русский",
      lang_fa: "فارسی"
    },
    fa: {
      brand_tag: "موسیقی، با نیت",
      nav_home: "کشف",
      nav_releases: "آثار جدید",
      nav_artists: "هنرمندان",
      nav_library: "کتابخانه",
      nav_search: "جستجو",
      nav_community: "گفتگو",
      nav_profile: "پروفایل",
      nav_lyrics: "متن آهنگ",
      nav_now: "در حال پخش",
      m_home: "خانه",
      m_releases: "آثار",
      m_artists: "هنرمندان",
      m_library: "کتابخانه",
      m_search: "جستجو",
      mood_persian: "ترپ فارسی",
      mood_late: "شب‌های دیر",
      mood_new: "قطعات تازه",
      mood_discuss: "گفتگو",
      mood_lyrics: "اتاق متن",
      mood_library: "کتابخانه شما",
      mode_dock: "نوار",
      mode_mini: "مینی",
      mode_stage: "صحنه",
      nothing_playing: "چیزی پخش نمی‌شود",
      local_audio: "صدای محلی",
      up_next: "بعدی",
      queue_empty: "صف خالی است — یک اثر باز کنید یا فایل وارد کنید.",
      volume: "صدا",
      share_room: "اشتراک در گفتگو",
      share_discuss: "اشتراک در گفتگو",
      draft_ready: "پیش‌نویس آماده است — در اتاق عمومی منتشر کنید.",
      listening_to: "در حال گوش دادن به",
      what_rotation: "الان چی گوش می‌دی؟",
      presence_idle: "آنچه می‌شنوید را با اتاق به اشتراک بگذارید",
      presence_sub: "گفتگوی عمومی",
      lyrics_eyebrow: "متن آهنگ · اتاق شیشه‌ای",
      lyrics_empty: "هنوز متنی نیست.\nهر خط یک عبارت — هنگام پخش در صحنه شیشه‌ای روشن می‌شود.",
      lyrics_label: "متن یا یادداشت بنویسید/بچسبانید (هر خط یک عبارت)",
      lyrics_save: "ذخیره متن",
      lyrics_preview: "پیش‌نمایش خطوط",
      lyrics_status: "ذخیره محلی برای هر قطعه · بدون دریافت متن دارای حق نشر",
      lyrics_placeholder: "هر خط یک عبارت…\nکلمات خودتان، ترجمه یا یادداشت.",
      discuss_title: "اتاق گفتگوی عمومی",
      discuss_copy: "گفتگوهای باز — نه پیام خصوصی. درباره ترپ فارسی، رپ آمریکایی، R&B و آثار جدید بنویسید. همه می‌توانند بخوانند و پاسخ دهند.",
      discuss_start: "شروع پست",
      community_h1: "درباره صدا حرف بزنیم.",
      community_p: "گفتگو درباره رپ آمریکایی، رپ فارسی، R&B، راک و آثار جدید.",
      channel: "کانال",
      your_post: "پست شما",
      post_placeholder: "یک گفتگوی موسیقایی شروع کنید…",
      publish: "انتشار پست",
      feed: "فید جامعه",
      all_topics: "همه موضوعات",
      community_note: "با پیکربندی Supabase وارد شوید تا پست‌ها برای دیگران دیده شود. بدون آن، پیش‌نمایش محلی است.",
      profile_h1: "پروفایل شما.",
      profile_p: "هویت شنونده و پلی‌لیست‌های این دستگاه را مدیریت کنید.",
      display_name: "نام نمایشی",
      bio: "بیو",
      save_profile: "ذخیره پروفایل",
      profile_note: "نمونه اولیه: پروفایل و پلی‌لیست در این مرورگر ذخیره می‌شود.",
      your_playlists: "پلی‌لیست‌های شما",
      playlist_hint: "قطعه فعلی را اضافه کنید یا هر زمان حذف کنید.",
      playlist_name: "نام پلی‌لیست",
      create: "＋ ساختن",
      account_sync: "حساب و همگام‌سازی",
      make_library: "کتابخانه را مال خودتان کنید.",
      sign_in_copy: "با ایمیل وارد شوید تا پروفایل و پلی‌لیست همگام شود و به جامعه بپیوندید.",
      email_link: "لینک ورود ایمیل شود",
      import_audio: "＋ وارد کردن صدا",
      import_note: "فایل‌ها روی دستگاه شما می‌مانند.",
      add_playlist: "＋ افزودن به پلی‌لیست",
      open_community: "گفتگو ↗",
      open_lyrics: "متن و یادداشت ↗",
      night: "حالت شب",
      light: "حالت روشن",
      lang: "زبان",
      hotkeys: "میانبرها",
      hotkeys_body: "Space پخش/توقف · ← → رد کردن · L متن · C گفتگو · N شب · ? راهنما",
      footer_phase: "فاز ۰۸ / STUDIO MAX",
      best_build: "بهترین نسخه",
      follow: "＋ دنبال کردن",
      following: "دنبال می‌کنید ✓",
      followers: "دنبال‌کنندگان",
      following_label: "دنبال‌شده‌ها",
      posts: "پست‌ها",
      your_profile: "پروفایل شما",
      sign_in_follow: "برای دنبال کردن وارد شوید",
      close: "بستن",
      no_bio: "هنوز بیویی نیست.",
      load_fail: "بارگذاری پروفایل ممکن نشد.",
      save: "ذخیره",
      edit: "ویرایش",
      delete: "حذف",
      like: "♡ پسند",
      liked: "♥ پسندیده‌شده",
      report: "گزارش",
      reply: "پاسخ",
      conversation: "گفتگو",
      shared: "جامعه مشترک",
      nothing_selected: "چیزی انتخاب نشده",
      choose_track: "در پخش‌کننده یک قطعه انتخاب کنید.",
      search_ph: "جستجوی هنرمند، اثر، ژانر…",
      toast_saved: "ذخیره شد",
      lang_en: "English",
      lang_ru: "Русский",
      lang_fa: "فارسی"
    }
  };

  function t(key) {
    return (dict[lang] && dict[lang][key]) || dict.en[key] || key;
  }

  function applyDir() {
    const rtl = lang === "fa";
    document.documentElement.lang = lang === "fa" ? "fa" : lang === "ru" ? "ru" : "en";
    document.documentElement.dir = rtl ? "rtl" : "ltr";
    document.body.classList.toggle("tf-rtl", rtl);
  }

  function injectStyles() {
    if (document.getElementById("tf-i18n-style")) return;
    const s = document.createElement("style");
    s.id = "tf-i18n-style";
    s.textContent = `
.tf-lang-switch{
  display:flex;align-items:center;gap:2px;padding:3px;border-radius:14px;
  border:1px solid #ffffffc9;background:#ffffff85;box-shadow:3px 3px 9px #c6ccd533;
}
.tf-lang-switch button{
  border:0;background:transparent;padding:8px 10px;border-radius:11px;
  font-size:11px;font-weight:750;cursor:pointer;color:#7c828d;
}
.tf-lang-switch button.active{background:#ffffffc9;color:#1c212b;box-shadow:inset 0 1px #fff}
html.tf-night .tf-lang-switch{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12);box-shadow:none}
html.tf-night .tf-lang-switch button{color:#9aa3b2}
html.tf-night .tf-lang-switch button.active{background:rgba(255,255,255,.12);color:#fff}
body.tf-rtl .shell,body.tf-rtl .tf-dock,body.tf-rtl .tf-compact,body.tf-rtl .tf-stage{direction:rtl}
body.tf-rtl .desktop-nav,body.tf-rtl .mobile-nav{direction:rtl}
body.tf-rtl .tf-dock-meta,body.tf-rtl .tf-compact-meta{text-align:right}
body.tf-rtl .tf-lyrics-stage,body.tf-rtl .community-layout,body.tf-rtl .profile-layout{direction:rtl}
body.tf-rtl .tf-lyric-line{text-align:right}
body.tf-rtl .post-top,body.tf-rtl .compose-bottom{direction:rtl}
`;
    document.head.appendChild(s);
  }

  function mountSwitcher() {
    const actions = document.querySelector(".top-actions");
    if (!actions || document.getElementById("tf-lang-switch")) return;
    const box = document.createElement("div");
    box.className = "tf-lang-switch";
    box.id = "tf-lang-switch";
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", t("lang"));
    [
      ["en", "EN"],
      ["ru", "RU"],
      ["fa", "FA"]
    ].forEach(([code, label]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.lang = code;
      b.textContent = label;
      b.title = t("lang_" + code);
      if (code === lang) b.classList.add("active");
      b.addEventListener("click", () => setLang(code));
      box.appendChild(b);
    });
    actions.prepend(box);
  }

  function setText(sel, key, attr) {
    const nodes = typeof sel === "string" ? document.querySelectorAll(sel) : [sel];
    nodes.forEach(n => {
      if (!n) return;
      if (attr) n.setAttribute(attr, t(key));
      else n.textContent = t(key);
    });
  }

  function translateStatic() {
    // Desktop nav by data-route
    const routeMap = {
      home: "nav_home",
      releases: "nav_releases",
      artists: "nav_artists",
      library: "nav_library",
      search: "nav_search",
      community: "nav_community",
      profile: "nav_profile",
      lyrics: "nav_lyrics",
      "now-playing": "nav_now"
    };
    document.querySelectorAll(".desktop-nav .nav-link[data-route]").forEach(btn => {
      const k = routeMap[btn.dataset.route];
      if (k) btn.textContent = t(k);
    });
    // Mobile nav — keep icon span, replace text node
    document.querySelectorAll(".mobile-nav .nav-link[data-route]").forEach(btn => {
      const k = {
        home: "m_home",
        releases: "m_releases",
        artists: "m_artists",
        library: "m_library",
        search: "m_search"
      }[btn.dataset.route];
      if (!k) return;
      const icon = btn.querySelector("span");
      btn.textContent = "";
      if (icon) btn.appendChild(icon);
      btn.appendChild(document.createTextNode(t(k)));
    });

    // Mood chips
    const moodKeys = ["mood_persian", "mood_late", "mood_new", "mood_discuss", "mood_lyrics", "mood_library"];
    document.querySelectorAll("#tf-mood-strip .tf-mood-chip").forEach((chip, i) => {
      if (moodKeys[i]) chip.textContent = t(moodKeys[i]);
    });

    // Player mode chips
    document.querySelectorAll("[data-tf-mode]").forEach(btn => {
      const m = btn.getAttribute("data-tf-mode");
      if (m === "dock" && btn.classList.contains("tf-mode-chip")) btn.textContent = t("mode_dock");
      if (m === "compact" && btn.classList.contains("tf-mode-chip")) btn.textContent = t("mode_mini");
      if (m === "stage" && btn.classList.contains("tf-mode-chip")) btn.textContent = t("mode_stage");
    });

    // Community page
    const comm = document.querySelector('[data-page="community"] .route-heading');
    if (comm) {
      const h1 = comm.querySelector("h1");
      const p = comm.querySelector("p");
      if (h1) h1.innerHTML = t("community_h1").replace("the sound.", "<span>the sound.</span>").replace("звуке.", "<span>звуке.</span>").replace("صدا حرف بزنیم.", "<span>صدا حرف بزنیم.</span>");
      if (p) p.textContent = t("community_p");
    }
    const banner = document.querySelector(".tf-discuss-banner");
    if (banner) {
      const h3 = banner.querySelector("h3");
      const bp = banner.querySelector("p");
      const bbtn = banner.querySelector("button");
      if (h3) h3.textContent = t("discuss_title");
      if (bp) bp.textContent = t("discuss_copy");
      if (bbtn) bbtn.textContent = t("discuss_start");
    }
    setText('label[for="tf-post-category"]', "channel");
    setText('label[for="tf-post-text"]', "your_post");
    const postText = document.getElementById("tf-post-text");
    if (postText) postText.placeholder = t("post_placeholder");
    setText("#tf-post-submit", "publish");
    const feedH = document.querySelector(".community-feed-head h2");
    if (feedH) feedH.textContent = t("feed");
    const filter = document.getElementById("tf-feed-filter");
    if (filter && filter.options[0]) filter.options[0].textContent = t("all_topics");
    const cnote = document.querySelector(".community-compose .small-note");
    if (cnote) cnote.textContent = t("community_note");

    // Profile
    const prof = document.querySelector('[data-page="profile"] .route-heading');
    if (prof) {
      const h1 = prof.querySelector("h1");
      const p = prof.querySelector("p");
      if (h1) h1.innerHTML = t("profile_h1").includes("profile") || t("profile_h1").includes("профиль") || t("profile_h1").includes("پروفایل")
        ? t("profile_h1").replace("profile.", "<span>profile.</span>").replace("профиль.", "<span>профиль.</span>").replace("پروفایل.", "<span>پروفایل.</span>")
        : t("profile_h1");
      if (p) p.textContent = t("profile_p");
    }
    setText('label[for="tf-profile-name"]', "display_name");
    setText('label[for="tf-profile-bio"]', "bio");
    setText("#tf-profile-save", "save_profile");
    const pnote = document.querySelector(".profile-card .small-note");
    if (pnote) pnote.textContent = t("profile_note");
    const plH = document.querySelector(".profile-playlists h2");
    if (plH) plH.textContent = t("your_playlists");
    const plP = document.querySelector(".profile-playlists .section-head p");
    if (plP) plP.textContent = t("playlist_hint");
    const plName = document.getElementById("tf-playlist-name");
    if (plName) plName.placeholder = t("playlist_name");
    const plSub = document.querySelector("#tf-playlist-form button");
    if (plSub) plSub.textContent = t("create");

    // Lyrics labels
    const lxLabel = document.querySelector('label[for="tf-lyrics-text"]');
    if (lxLabel) lxLabel.textContent = t("lyrics_label");
    const lxSave = document.getElementById("tf-lyrics-save");
    if (lxSave) lxSave.textContent = t("lyrics_save");
    const lxRef = document.getElementById("tf-lx-refresh");
    if (lxRef) lxRef.textContent = t("lyrics_preview");
    const lxStatus = document.getElementById("tf-lyrics-status");
    if (lxStatus) lxStatus.textContent = t("lyrics_status");
    const lxText = document.getElementById("tf-lyrics-text");
    if (lxText) lxText.placeholder = t("lyrics_placeholder");
    const lxEyebrow = document.querySelector(".tf-lyrics-head .eyebrow");
    if (lxEyebrow) lxEyebrow.textContent = t("lyrics_eyebrow");

    // Import / player secondary
    const imp = document.getElementById("tf-import-audio");
    if (imp) imp.textContent = t("import_audio");
    const impNote = document.getElementById("tf-audio-status");
    if (impNote) impNote.textContent = t("import_note");
    const pp = document.getElementById("tf-player-profile");
    if (pp) pp.textContent = t("add_playlist");
    const pc = document.getElementById("tf-player-community");
    if (pc) pc.textContent = t("open_community");
    const pl = document.getElementById("tf-player-lyrics");
    if (pl) pl.textContent = t("open_lyrics");

    // Presence
    const pshare = document.getElementById("tf-presence-share");
    if (pshare) pshare.textContent = t("share_room");

    // Theme button title
    const themeBtn = document.getElementById("tf-theme-toggle");
    if (themeBtn) {
      const night = document.documentElement.classList.contains("tf-night");
      themeBtn.title = night ? t("light") : t("night");
    }

    // Footer
    const foot = document.querySelector(".footer span:last-child");
    if (foot) {
      foot.innerHTML = `${t("footer_phase")} <span class="tf-phase-badge">${t("best_build")}</span>`;
    }

    // Search placeholder if present
    const search = document.querySelector('#page-search input, input[type="search"], #search-input');
    if (search) search.placeholder = t("search_ph");

    // Lang switch titles
    document.querySelectorAll("#tf-lang-switch button").forEach(b => {
      b.classList.toggle("active", b.dataset.lang === lang);
      b.title = t("lang_" + b.dataset.lang);
    });
  }

  function setLang(code) {
    if (!supported.includes(code)) return;
    lang = code;
    localStorage.setItem(LANG_KEY, lang);
    applyDir();
    translateStatic();
    // Refresh dynamic player chrome labels that studio/phase own
    try {
      document.querySelectorAll("#tf-dock-title, #tf-compact-title, #tf-stage-title").forEach(n => {
        if (!n.textContent || n.textContent === "Nothing playing" || n.textContent === "Ничего не играет" || n.textContent === "چیزی پخش نمی‌شود") {
          n.textContent = t("nothing_playing");
        }
      });
      const empty = document.querySelector("#tf-lx-lines .tf-lyrics-empty");
      if (empty) empty.innerHTML = t("lyrics_empty").replace(/\n/g, "<br>");
      const qh = document.querySelector("#tf-stage-queue h4");
      if (qh) qh.textContent = t("up_next");
    } catch (_) {}
    window.dispatchEvent(new CustomEvent("tf:lang", { detail: { lang } }));
  }

  // Expose for other modules
  window.tfI18n = { t, setLang, getLang: () => lang, dict };

  // Patch phase08 share text + hotkeys when available
  function patchIntegrations() {
    // Override toast/share strings by intercepting known flows is hard;
    // re-translate after phase08 mounts
    translateStatic();
  }

  function init() {
    injectStyles();
    applyDir();
    mountSwitcher();
    // Delay so studio/phase08 DOM exists
    const run = () => {
      translateStatic();
      patchIntegrations();
    };
    run();
    setTimeout(run, 200);
    setTimeout(run, 800);
    // Re-apply on hash route changes
    window.addEventListener("hashchange", () => setTimeout(translateStatic, 50));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
