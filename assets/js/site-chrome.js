// Shieldio — shared page chrome: scroll progress bar, back-to-top, cookie banner, last-updated note.
// Bump LAST_UPDATED by hand after a deploy that changes visible content — no build step to automate it.

const LAST_UPDATED = "26. 8. 2026";
const COOKIE_CONSENT_KEY = "shieldio-cookie-consent";

document.addEventListener("DOMContentLoaded", () => {

  // ---------- scroll progress bar ----------
  const progressTrack = document.createElement("div");
  progressTrack.className = "scroll-progress-track";
  progressTrack.innerHTML = '<div class="scroll-progress-bar"></div>';
  document.body.appendChild(progressTrack);
  const progressBar = progressTrack.querySelector(".scroll-progress-bar");

  // page is "about PRO" if its own h1 says so — not just any mention of PRO on the page
  if (document.querySelector("h1 .text-tier-pro")) {
    progressBar.classList.add("is-pro");
  }

  function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
    // the gradient itself never rescales — scrolling only unmasks more of it left-to-right
    progressBar.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
  }
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
  updateProgress();

  // ---------- back to top ----------
  const backToTop = document.createElement("button");
  backToTop.type = "button";
  backToTop.className = "back-to-top";
  backToTop.setAttribute("aria-label", "Zpět nahoru");
  backToTop.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  });
  document.body.appendChild(backToTop);

  function updateBackToTop() {
    backToTop.classList.toggle("visible", window.scrollY > 600);
  }
  window.addEventListener("scroll", updateBackToTop, { passive: true });
  updateBackToTop();

  // ---------- cookie consent banner ----------
  let consent;
  try { consent = localStorage.getItem(COOKIE_CONSENT_KEY); } catch (e) { consent = "accepted"; }

  if (!consent) {
    // depth of the current page relative to site root, so the privacy link always resolves
    const depth = (document.querySelector('link[rel="canonical"]')?.getAttribute("href") || "")
      ? window.location.pathname.split("/").filter(Boolean).length
      : 0;
    const prefix = depth > 1 ? "../".repeat(depth - 1) : "";
    const privacyHref = window.location.pathname.includes("/company/") ? "privacy.html" : prefix + "company/privacy.html";

    const banner = document.createElement("div");
    banner.className = "cookie-banner";
    banner.innerHTML = `
      <p>Web používá základní cookies pro fungování a volitelně analytiku návštěvnosti. Víc v <a href="${privacyHref}">Ochraně údajů</a>.</p>
      <div class="cookie-banner-actions">
        <button type="button" class="btn btn-primary" data-consent="accepted">Přijmout</button>
        <button type="button" class="btn btn-ghost" data-consent="declined" style="border-color:var(--line); color:var(--ink-soft);">Odmítnout</button>
      </div>
    `;
    document.body.appendChild(banner);
    document.body.classList.add("has-cookie-banner");
    requestAnimationFrame(() => banner.classList.add("visible"));

    banner.querySelectorAll("[data-consent]").forEach((btn) => {
      btn.addEventListener("click", () => {
        try { localStorage.setItem(COOKIE_CONSENT_KEY, btn.dataset.consent); } catch (e) {}
        banner.classList.remove("visible");
        document.body.classList.remove("has-cookie-banner");
        setTimeout(() => banner.remove(), 400);
      });
    });
  }

  // ---------- last updated note in footer ----------
  const footerInner = document.querySelector("footer .footer-inner");
  if (footerInner) {
    const note = document.createElement("div");
    note.className = "last-updated";
    note.textContent = "Poslední aktualizace: " + LAST_UPDATED;
    footerInner.appendChild(note);
  }
});
