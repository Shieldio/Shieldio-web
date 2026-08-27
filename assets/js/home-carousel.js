// Shieldio — homepage deepdive photo strip: auto-scrolls slowly, stays user-scrollable,
// pauses on hover/touch/manual scroll so it never fights the visitor.
(function () {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  document.addEventListener("DOMContentLoaded", () => {
    const track = document.getElementById("deepdiveCarousel");
    if (!track) return;

    let paused = false;
    let resumeTimer = null;

    function pause() {
      paused = true;
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => { paused = false; }, 2500);
    }

    track.addEventListener("mouseenter", () => { paused = true; });
    track.addEventListener("mouseleave", () => { paused = false; });
    track.addEventListener("touchstart", pause, { passive: true });
    track.addEventListener("wheel", pause, { passive: true });

    setInterval(() => {
      if (paused) return;
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
      if (atEnd) {
        track.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        track.scrollBy({ left: 1, behavior: "auto" });
      }
    }, 30);
  });
})();
