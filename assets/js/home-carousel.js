// Shieldio — homepage auto-scrolling strips (topic teaser cards, etc.): scrolls slowly on
// its own, stays user-scrollable, pauses on hover/touch/manual scroll so it never fights
// the visitor.
(function () {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  function initCarousel(track) {
    let paused = false;
    let resumeTimer = null;

    function pauseTemporarily() {
      paused = true;
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => { paused = false; }, 2500);
    }

    track.addEventListener("mouseenter", () => { paused = true; });
    track.addEventListener("mouseleave", () => { paused = false; });
    track.addEventListener("focusin", () => { paused = true; });
    track.addEventListener("focusout", () => { paused = false; });
    track.addEventListener("touchstart", pauseTemporarily, { passive: true });
    track.addEventListener("wheel", pauseTemporarily, { passive: true });

    setInterval(() => {
      if (paused || document.hidden) return;
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
      if (atEnd) {
        track.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        track.scrollBy({ left: 1, behavior: "auto" });
      }
    }, 30);
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".auto-carousel").forEach(initCarousel);
  });
})();
