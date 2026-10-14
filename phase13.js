/* TRAPFARSI Phase 13 — synced listener profile controls.
 * Adds account metadata inside existing profile styles; no theme/layout redesign.
 */
(() => {
  "use strict";
  const PROFILE_KEY = "tf_profile_v1";
  const $ = id => document.getElementById(id);
  const messages = {
    en: {
      handle: "USERNAME", handleHint: "3–20 lowercase letters, numbers, or underscores.",
      location: "LOCATION (OPTIONAL)", genres: "FAVOURITE GENRES", avatar: "AVATAR IMAGE URL (OPTIONAL)",
      public: "Make my profile public", privacy: "Private profiles hide profile details and follower metrics from other listeners.",
      status: "Profile settings are saved on this device and sync to your account when signed in.",
      invalid: "Use 3–20 letters, numbers, or underscores for the username.",
      badAvatar: "Avatar URL must use HTTPS or HTTP.", genresPlaceholder: "Persian rap, trap, alternative R&B"
    },
    ru: {
      handle: "ИМЯ ПОЛЬЗОВАТЕЛЯ", handleHint: "3–20 строчных букв, цифр или подчёркиваний.",
      location: "ГОРОД (НЕОБЯЗАТЕЛЬНО)", genres: "ЛЮБИМЫЕ ЖАНРЫ", avatar: "ССЫЛКА НА АВАТАР (НЕОБЯЗАТЕЛЬНО)",
      public: "Сделать профиль публичным", privacy: "В приватном профиле данные и показатели подписок скрыты от других слушателей.",
      status: "Настройки сохраняются на устройстве и синхронизируются с аккаунтом после входа.",
      invalid: "Имя: 3–20 строчных букв, цифр или подчёркиваний.",
      badAvatar: "Ссылка на аватар должна использовать HTTPS или HTTP.", genresPlaceholder: "Русский рэп, трэп, альтернативный R&B"
    },
    fa: {
      handle: "نام کاربری", handleHint: "۳ تا ۲۰ حرف انگلیسی کوچک، عدد یا زیرخط.",
      location: "شهر (اختیاری)", genres: "سبک‌های موسیقی موردعلاقه", avatar: "پیوند تصویر پروفایل (اختیاری)",
      public: "پروفایل من برای دیگران عمومی باشد", privacy: "در پروفایل خصوصی، جزئیات و آمار دنبال‌کنندگان برای دیگران پنهان می‌ماند.",
      status: "تنظیمات روی این دستگاه ذخیره و پس از ورود با حساب شما همگام می‌شود.",
      invalid: "نام کاربری باید ۳ تا ۲۰ حرف انگلیسی کوچک، عدد یا زیرخط باشد.",
      badAvatar: "پیوند تصویر باید با HTTPS یا HTTP شروع شود.", genresPlaceholder: "رپ فارسی، ترپ، آراندبی آلترناتیو"
    }
  };
  const lang = () => window.tfI18n?.getLang?.() || "en";
  const t = key => (messages[lang()] || messages.en)[key] || messages.en[key] || key;
  function readProfile() {
    try {
      const value = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
      return value && typeof value === "object" ? value : {};
    } catch (_) { return {}; }
  }
  function writeProfile(profile) {
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); return true; }
    catch (_) { return false; }
  }
  function makeField(container, id, key, type = "text", placeholder = "") {
    const wrap = document.createElement("div");
    wrap.className = "tf13-profile-field";
    const label = document.createElement("label");
    label.className = "field-label";
    label.htmlFor = id;
    label.textContent = t(key);
    const input = document.createElement("input");
    input.id = id;
    input.type = type;
    input.className = "community-input";
    input.maxLength = id === "tf13-avatar-url" ? 500 : 180;
    input.autocomplete = id === "tf13-handle" ? "nickname" : "off";
    if (placeholder) input.placeholder = placeholder;
    wrap.append(label, input);
    container.append(wrap);
    return { label, input };
  }
  function mount() {
    const card = document.querySelector("#page-profile .profile-card");
    const save = $("tf-profile-save");
    if (!card || !save || $("tf13-profile-extra")) return;
    const style = document.createElement("style");
    style.id = "tf13-profile-style";
    style.textContent = ".tf13-profile-extra{display:grid;gap:10px;margin:12px 0}.tf13-profile-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}.tf13-check{display:flex;align-items:flex-start;gap:9px;color:#707783;font-size:11px;line-height:1.6;margin:4px 0}.tf13-check input{margin-top:3px}@media(max-width:600px){.tf13-profile-row{grid-template-columns:1fr}}";
    document.head.append(style);
    const extra = document.createElement("div");
    extra.id = "tf13-profile-extra";
    extra.className = "tf13-profile-extra";
    const row = document.createElement("div"); row.className = "tf13-profile-row";
    const handle = makeField(row, "tf13-handle", "handle");
    const location = makeField(row, "tf13-location", "location");
    extra.append(row);
    const row2 = document.createElement("div"); row2.className = "tf13-profile-row";
    const genres = makeField(row2, "tf13-genres", "genres", "text", t("genresPlaceholder"));
    const avatar = makeField(row2, "tf13-avatar-url", "avatar", "url", "https://example.com/avatar.jpg");
    extra.append(row2);
    const privacy = document.createElement("label"); privacy.className = "tf13-check";
    const pub = document.createElement("input"); pub.id = "tf13-public"; pub.type = "checkbox";
    const publicText = document.createElement("span"); publicText.textContent = t("public");
    privacy.append(pub, publicText); extra.append(privacy);
    const help = document.createElement("p"); help.className = "small-note"; help.id = "tf13-profile-help"; help.textContent = t("privacy"); extra.append(help);
    const status = document.createElement("p"); status.className = "small-note"; status.id = "tf13-profile-status"; status.setAttribute("role", "status"); status.textContent = t("status"); extra.append(status);
    save.insertAdjacentElement("beforebegin", extra);
    let pendingFields = null;
    function fill() {
      const p = readProfile();
      handle.input.value = String(p.handle || "");
      location.input.value = String(p.location || "");
      genres.input.value = Array.isArray(p.genres) ? p.genres.join(", ") : "";
      avatar.input.value = String(p.avatarUrl || "");
      pub.checked = p.public !== false;
    }
    function translate() {
      handle.label.textContent = t("handle");
      location.label.textContent = t("location");
      genres.label.textContent = t("genres");
      avatar.label.textContent = t("avatar");
      handle.input.title = t("handleHint");
      genres.input.placeholder = t("genresPlaceholder");
      publicText.textContent = t("public");
      help.textContent = t("privacy");
      if (!status.dataset.error) status.textContent = t("status");
    }
    fill();
    // Validate during capture, before the existing Save handler writes name/bio.
    save.addEventListener("click", event => {
      pendingFields = null;
      const username = handle.input.value.trim().replace(/^@/, "").toLowerCase();
      if (username && !/^[a-z0-9_]{3,20}$/.test(username)) {
        event.preventDefault(); event.stopImmediatePropagation();
        handle.input.setCustomValidity(t("invalid")); handle.input.reportValidity(); handle.input.focus();
        status.dataset.error = "1"; status.textContent = t("invalid"); return;
      }
      handle.input.setCustomValidity("");
      const avatarValue = avatar.input.value.trim();
      if (avatarValue && !/^https?:\/\//i.test(avatarValue)) {
        event.preventDefault(); event.stopImmediatePropagation();
        avatar.input.setCustomValidity(t("badAvatar")); avatar.input.reportValidity(); avatar.input.focus();
        status.dataset.error = "1"; status.textContent = t("badAvatar"); return;
      }
      avatar.input.setCustomValidity("");
      delete status.dataset.error;
      pendingFields = {
        handle: username,
        location: location.input.value.trim().slice(0, 60),
        genres: [...new Set(genres.input.value.split(",").map(value => value.trim()).filter(Boolean))].slice(0, 12),
        avatarUrl: avatarValue ? avatarValue.slice(0, 500) : "",
        public: pub.checked
      };
    }, true);
    // The original save handler re-renders the form; persist the captured values
    // rather than reading controls that the legacy renderer may have reset.
    save.addEventListener("click", () => {
      const previous = readProfile();
      const fields = pendingFields;
      pendingFields = null;
      if (!fields) return;
      const next = { ...previous, ...fields, updatedAt: Date.now() };
      if (writeProfile(next)) {
        status.dataset.error = "";
        status.textContent = t("status");
        fill();
        window.dispatchEvent(new CustomEvent("tf:profile-updated"));
      } else {
        status.dataset.error = "1";
        status.textContent = "Browser storage is unavailable or full.";
      }
    });
    window.addEventListener("tf:lang", translate);
    window.addEventListener("tf:profile-updated", fill);
    const originalRender = window.tfRenderProfile;
    window.tfRenderProfile = function() {
      if (typeof originalRender === "function") originalRender.apply(this, arguments);
      fill();
    };
    translate();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
  else mount();
})();