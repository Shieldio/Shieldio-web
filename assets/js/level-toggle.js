// Shieldio — shared "Jednoduše / Pokročile / Plně" toggle for the "Jak to funguje" learning pages.
// Persists site-wide in localStorage, same pattern as the light/dark theme toggle.
(function () {
  const STORAGE_KEY = "shieldio-learn-level";
  const LEVELS = ["simple", "advanced", "equations"];

  function renderMath() {
    if (window.renderMathInElement) {
      renderMathInElement(document.body, {
        delimiters: [
          { left: "\\[", right: "\\]", display: true },
          { left: "\\(", right: "\\)", display: false },
        ],
        throwOnError: false,
      });
    }
  }

  function apply(level) {
    document.documentElement.dataset.learnLevel = level;
    document.querySelectorAll("[data-level-toggle]").forEach((toggle) => {
      toggle.querySelectorAll(".guide-mode-btn").forEach((btn) => {
        const active = btn.dataset.level === level;
        btn.classList.toggle("active", active);
        btn.setAttribute("aria-pressed", String(active));
      });
    });
    document.dispatchEvent(new CustomEvent("shieldio-learn-level-change", { detail: { level } }));
  }

  function init() {
    let level = "simple";
    try {
      level = localStorage.getItem(STORAGE_KEY) || "simple";
      if (!LEVELS.includes(level)) level = "simple";
    } catch (e) {}
    apply(level);
    renderMath();

    document.querySelectorAll("[data-level-toggle] .guide-mode-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        level = btn.dataset.level;
        apply(level);
        try {
          localStorage.setItem(STORAGE_KEY, level);
        } catch (e) {}
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
