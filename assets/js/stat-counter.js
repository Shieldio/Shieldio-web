// Shieldio — hero stats (3 / 100×100 mm / 5 min) count up from 0 once they scroll into
// view. Works on mixed text like "100×100 mm" by animating every number found in the
// string independently and rebuilding the original text around them each frame.
(function () {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function animateStat(el) {
    const original = el.textContent;
    const numbers = original.match(/\d+/g);
    if (!numbers) return;

    const targets = numbers.map(Number);
    const duration = 900;
    const start = performance.now();

    function frame(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = easeOutExpo(progress);
      let i = 0;
      const current = original.replace(/\d+/g, () => {
        const value = Math.round(targets[i] * eased);
        i++;
        return String(value);
      });
      el.textContent = current;
      if (progress < 1) requestAnimationFrame(frame);
      else el.textContent = original;
    }
    requestAnimationFrame(frame);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const stats = document.querySelectorAll(".hero-stats .stat b");
    if (!stats.length) return;

    if (prefersReducedMotion) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          stats.forEach((el, i) => setTimeout(() => animateStat(el), i * 120));
          observer.disconnect();
        });
      },
      { threshold: 0.6 }
    );
    observer.observe(document.querySelector(".hero-stats"));
  });
})();
