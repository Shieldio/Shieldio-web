// Shieldio — "Průběh hodiny" steps: each step's connecting track fills in with a stagger
// as the row scrolls into view. Hover state itself is pure CSS (see .step:hover in style.css).
(function () {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.addEventListener("DOMContentLoaded", () => {
    const steps = document.querySelectorAll("#howItWorksSteps .step");
    if (!steps.length) return;

    if (prefersReducedMotion) {
      steps.forEach((step) => step.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          steps.forEach((step, i) => {
            setTimeout(() => step.classList.add("is-visible"), i * 180);
          });
          observer.disconnect();
        });
      },
      { threshold: 0.35 }
    );
    observer.observe(steps[0].closest(".steps"));
  });
})();
