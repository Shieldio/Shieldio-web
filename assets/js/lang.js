// Shieldio — CS/EN runtime language switch for the pages that have a translation dictionary.
// Same pattern as theme.js: injected toggle, localStorage persistence, no page reload needed.
// Pages without assets/data/i18n.json entries for their [data-i18n] keys simply stay Czech.

(function () {
  let dict = null;

  function currentLang() {
    return document.documentElement.lang === "en" ? "en" : "cs";
  }

  function applyLang(lang) {
    if (!dict) return;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const entry = dict[key];
      if (entry && entry[lang] != null) {
        el.innerHTML = entry[lang];
      }
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      const entry = dict[key];
      if (entry && entry[lang] != null) el.setAttribute("placeholder", entry[lang]);
    });
    document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
      const key = el.getAttribute("data-i18n-alt");
      const entry = dict[key];
      if (entry && entry[lang] != null) el.setAttribute("alt", entry[lang]);
    });
    document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
      const key = el.getAttribute("data-i18n-aria-label");
      const entry = dict[key];
      if (entry && entry[lang] != null) el.setAttribute("aria-label", entry[lang]);
    });
    const titleKey = document.body.getAttribute("data-i18n-title");
    if (titleKey && dict[titleKey] && dict[titleKey][lang] != null) {
      document.title = dict[titleKey][lang];
    }
  }

  function setLang(lang) {
    document.documentElement.lang = lang === "en" ? "en" : "cs";
    try { localStorage.setItem("shieldio-lang", lang); } catch (e) {}
    document.querySelectorAll(".lang-toggle").forEach((btn) => {
      btn.textContent = lang === "en" ? "CS" : "EN";
      btn.setAttribute("aria-label", lang === "en" ? "Přepnout na češtinu" : "Switch to English");
    });
    applyLang(lang);
    if (window.renderMathInElement) {
      window.renderMathInElement(document.body, {
        delimiters: [
          { left: "\\[", right: "\\]", display: true },
          { left: "\\(", right: "\\)", display: false },
        ],
        throwOnError: false,
      });
    }
    document.dispatchEvent(new CustomEvent("shieldio-lang-change", { detail: { lang } }));
  }

  function buildToggleButton() {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lang-toggle";
    btn.textContent = currentLang() === "en" ? "CS" : "EN";
    btn.addEventListener("click", () => {
      setLang(currentLang() === "en" ? "cs" : "en");
    });
    return btn;
  }

  function mobileUtilsRow(topbar) {
    const nav = topbar.querySelector(".topbar-inner nav");
    if (!nav) return null;
    let row = nav.querySelector(".topbar-mobile-utils");
    if (!row) {
      row = document.createElement("div");
      row.className = "topbar-mobile-utils";
      nav.prepend(row);
    }
    return row;
  }

  // theme/search/lang toggles share one grouped pill in the topbar instead of
  // three separately-outlined circles — whichever script runs first creates it
  function utilsCluster(navLinks) {
    let cluster = navLinks.querySelector(":scope > .nav-utils");
    if (!cluster) {
      cluster = document.createElement("div");
      cluster.className = "nav-utils";
      const hamburger = navLinks.querySelector(":scope > .nav-toggle");
      if (hamburger) navLinks.insertBefore(cluster, hamburger);
      else navLinks.appendChild(cluster);
    }
    return cluster;
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!document.querySelector("[data-i18n]")) return; // page has no translations — nothing to do

    document.querySelectorAll(".topbar").forEach((topbar) => {
      const navLinks = topbar.querySelector(".nav-links");
      if (navLinks) utilsCluster(navLinks).appendChild(buildToggleButton());
      const row = mobileUtilsRow(topbar);
      if (row) row.appendChild(buildToggleButton());
    });

    fetch("/assets/data/i18n.json")
      .then((r) => r.json())
      .then((data) => {
        dict = data;
        let lang = "cs";
        try { lang = localStorage.getItem("shieldio-lang") || "cs"; } catch (e) {}
        setLang(lang);
      })
      .catch(() => {});
  });
})();
