// Shieldio — site search: small modal over a static JSON index, substring match, no backend

document.addEventListener("DOMContentLoaded", () => {
  let indexData = null;
  let overlay, input, resultsEl;

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function renderResults(query) {
    const q = query.trim().toLowerCase();
    if (!indexData) { resultsEl.innerHTML = '<p class="search-empty">Načítám…</p>'; return; }
    if (!q) { resultsEl.innerHTML = '<p class="search-empty">Začni psát název stránky, produktu nebo návodu…</p>'; return; }
    const matches = indexData
      .filter((e) => (e.title + " " + e.desc).toLowerCase().includes(q))
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
      fetch("/assets/data/search-index.json")
        .then((r) => r.json())
        .then((data) => { indexData = data; renderResults(input.value); })
        .catch(() => { resultsEl.innerHTML = '<p class="search-empty">Vyhledávání se nepodařilo načíst.</p>'; });
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
    btn.setAttribute("aria-label", "Hledat na webu");
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>';
    btn.addEventListener("click", openSearch);
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

  document.querySelectorAll(".topbar").forEach((topbar) => {
    const navLinks = topbar.querySelector(".nav-links");
    if (navLinks) {
      // :scope > avoids matching the mobile-dropdown copy nested inside .nav-links nav
      const themeBtn = navLinks.querySelector(":scope > .theme-toggle");
      const hamburger = navLinks.querySelector(":scope > .nav-toggle");
      const btn = buildSearchButton();
      if (themeBtn) navLinks.insertBefore(btn, themeBtn);
      else if (hamburger) navLinks.insertBefore(btn, hamburger);
      else navLinks.appendChild(btn);
    }

    const row = mobileUtilsRow(topbar);
    if (row) row.prepend(buildSearchButton());
  });
});
