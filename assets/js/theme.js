// Shieldio — light/dark mode toggle, injected into every topbar, persisted across pages

(function () {
  function currentTheme() {
    return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  }

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("shieldio-theme", theme); } catch (e) {}
    document.querySelectorAll(".theme-toggle").forEach((btn) => {
      btn.setAttribute("aria-label", theme === "dark" ? "Přepnout na světlý režim" : "Přepnout na tmavý režim");
    });
    window.dispatchEvent(new CustomEvent("shieldio:theme-change", { detail: { theme } }));
  }

  function buildToggleButton() {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-toggle";
    btn.innerHTML =
      '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2.5M12 19v2.5M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2.5 12H5M19 12h2.5M4.2 19.8L6 18M18 6l1.8-1.8"/></svg>' +
      '<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z"/></svg>';
    btn.addEventListener("click", () => {
      setTheme(currentTheme() === "dark" ? "light" : "dark");
    });
    return btn;
  }

  // the topbar has no room for icon buttons on narrow screens (cta pill + icons +
  // hamburger overflow) — so mobile gets a second copy tucked into the nav dropdown
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
    document.querySelectorAll(".topbar").forEach((topbar) => {
      const navLinks = topbar.querySelector(".nav-links");
      if (!navLinks) return;
      utilsCluster(navLinks).appendChild(buildToggleButton());

      const row = mobileUtilsRow(topbar);
      if (row) row.appendChild(buildToggleButton());
    });
    setTheme(currentTheme());
  });

  // keep tabs in sync if the user flips the toggle in another tab
  window.addEventListener("storage", (e) => {
    if (e.key === "shieldio-theme" && e.newValue) {
      document.documentElement.dataset.theme = e.newValue;
    }
  });
})();
