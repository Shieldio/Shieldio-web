// Shieldio — mobile nav toggle

document.addEventListener("DOMContentLoaded", () => {
  const topbar = document.querySelector(".topbar");
  const toggle = document.querySelector(".nav-toggle");
  if (!topbar || !toggle) return;

  function syncLabel() {
    const open = topbar.classList.contains("nav-open");
    const en = document.documentElement.lang === "en";
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", en ? (open ? "Close menu" : "Open menu") : (open ? "Zavřít menu" : "Otevřít menu"));
  }
  toggle.addEventListener("click", () => { topbar.classList.toggle("nav-open"); syncLabel(); });
  document.addEventListener("shieldio-lang-change", syncLabel);
  syncLabel();

  topbar.querySelectorAll("nav a").forEach(link => {
    link.addEventListener("click", () => {
      topbar.classList.remove("nav-open");
      syncLabel();
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && topbar.classList.contains("nav-open")) {
      topbar.classList.remove("nav-open");
      syncLabel();
      toggle.focus();
    }
  });
});
