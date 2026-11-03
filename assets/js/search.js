// Shieldio — local search over page titles, descriptions and project components.

document.addEventListener("DOMContentLoaded", () => {
  let indexData = null, loading = null;
  let overlay, input, resultsEl;

  const languageText = (cs,en) => document.documentElement?.lang === "en" ? en : cs;
  function labelSearch() {
    document.querySelectorAll(".search-toggle").forEach(btn => btn.setAttribute("aria-label", languageText("Hledat na webu", "Search the site")));
    if (overlay) {
      overlay.querySelector(".modal-close").setAttribute("aria-label", languageText("Zavřít", "Close search"));
      input.setAttribute("placeholder", languageText("Hledat na webu…", "Search the site…"));
      input.setAttribute("aria-label", languageText("Hledat na webu", "Search the site"));
    }
  }
  document.addEventListener("shieldio-lang-change", labelSearch);
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function normalize(value) {
    return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  function prepareEntry(entry, order) {
    const title = normalize(entry.title), description = normalize(entry.desc);
    const keywords = normalize((entry.keywords || []).join(" "));
    return {...entry, order, titleText:title, descriptionText:description, keywordsText:keywords, searchText:`${title} ${description} ${keywords}`};
  }

  function renderResults(query) {
    const q = normalize(query);
    if (!indexData) { resultsEl.innerHTML = '<p class="search-empty">Načítám…</p>'; return; }
    if (!q) { resultsEl.innerHTML = '<p class="search-empty">Začni psát název stránky, produktu nebo návodu…</p>'; return; }
    const terms = q.split(/\s+/);
    const matches = indexData
      .filter((e) => terms.every(term => e.searchText.includes(term)))
      .map(e => ({...e, score:(e.titleText === q ? 100 : e.titleText.includes(q) ? 60 : 0)
        + (e.kind === "project" ? 25 : 0) + (e.keywordsText.includes(q) ? 60 : 0)
        + (e.descriptionText.includes(q) ? 10 : 0)}))
      .sort((a,b) => b.score - a.score || a.order - b.order)
      .slice(0, 8);
    if (!matches.length) { resultsEl.innerHTML = '<p class="search-empty">Nic jsem nenašel.</p>'; return; }
    resultsEl.innerHTML = matches
      .map(
        (e) => `
      <a class="search-result" href="${e.url}">
        <span class="search-result-title">${escapeHtml(e.title)}</span>
        <span class="search-result-desc">${escapeHtml(e.desc)}</span>
      </a>`
      )
      .join("");
  }

  function ensureModal() {
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.className = "modal-overlay search-overlay";
    overlay.innerHTML = `
      <div class="modal-card search-card">
        <button type="button" class="modal-close" aria-label="Zavřít">&times;</button>
        <input type="text" class="search-input" placeholder="Hledat na webu…" autocomplete="off">
        <div class="search-results"></div>
      </div>
    `;
    document.body.appendChild(overlay);
    input = overlay.querySelector(".search-input");
    resultsEl = overlay.querySelector(".search-results");
    labelSearch();

    overlay.addEventListener("click", (e) => { if (e.target === overlay) closeSearch(); });
    overlay.querySelector(".modal-close").addEventListener("click", closeSearch);
    input.addEventListener("input", () => renderResults(input.value));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const first = resultsEl.querySelector("a");
        if (first) window.location.href = first.getAttribute("href");
      }
    });
  }

  function openSearch() {
    ensureModal();
    overlay.classList.add("active");
    if (!indexData) {
      if (!loading) loading = fetch("/assets/data/search-index.json", {cache:"no-cache"})
        .then((r) => {if (!r.ok) throw Error("Search index unavailable");return r.json();})
        .then((data) => { indexData = data.map(prepareEntry); renderResults(input.value); })
        .catch(() => { resultsEl.innerHTML = '<p class="search-empty">Vyhledávání se nepodařilo načíst. Zkus ho otevřít znovu.</p>'; })
        .finally(() => {loading = null;});
    }
    renderResults(input.value);
    setTimeout(() => input.focus(), 50);
  }

  function closeSearch() {
    if (overlay) overlay.classList.remove("active");
  }

  document.addEventListener("keydown", (e) => {
    if (overlay && overlay.classList.contains("active") && e.key === "Escape") closeSearch();
    if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      openSearch();
    }
  });

  function buildSearchButton() {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "search-toggle";
    btn.setAttribute("aria-label", languageText("Hledat na webu", "Search the site"));
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>';
    btn.addEventListener("click", () => {
      btn.classList.remove("pulse");
      void btn.offsetWidth; // restart the animation on repeat clicks
      btn.classList.add("pulse");
      openSearch();
    });
    return btn;
  }

  // mirrors theme.js: narrow screens get a second copy inside the mobile nav
  // dropdown, since the top-level bar has no room for extra icon buttons
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

  document.querySelectorAll(".topbar").forEach((topbar) => {
    const navLinks = topbar.querySelector(".nav-links");
    if (navLinks) utilsCluster(navLinks).appendChild(buildSearchButton());

    const row = mobileUtilsRow(topbar);
    if (row) row.prepend(buildSearchButton());
  });
});
