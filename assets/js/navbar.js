// Shieldio — mobile nav toggle

document.addEventListener("DOMContentLoaded", () => {
  const topbar = document.querySelector(".topbar");
  const toggle = document.querySelector(".nav-toggle");
  if (!topbar || !toggle) return;

  toggle.addEventListener("click", () => {
    const isOpen = topbar.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  topbar.querySelectorAll("nav a").forEach(link => {
    link.addEventListener("click", () => {
      topbar.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      topbar.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
});
