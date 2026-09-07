// Shieldio — scroll reveal, hero board entrance animation, mouse-tilt

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
document.documentElement.classList.add("js-reveal");

document.addEventListener("DOMContentLoaded", () => {

  // scroll reveal for .fade-up elements
  const revealEls = document.querySelectorAll(".fade-up");

  if (prefersReducedMotion) {
    revealEls.forEach(el => el.classList.add("visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach(el => observer.observe(el));

    // A reveal animation must never make the site unusable. Safari can delay an
    // IntersectionObserver callback after restoring a tab, so reveal anything
    // still waiting once the entrance animation has had enough time to run.
    window.setTimeout(() => {
      revealEls.forEach(el => el.classList.add("visible"));
    }, 1400);
  }

  // hero board: fly in + rotate into place shortly after load
  const frames = document.querySelectorAll(".board-photo-frame");
  if (prefersReducedMotion) {
    frames.forEach(frame => frame.classList.add("flown-in"));
  } else {
    requestAnimationFrame(() => {
      setTimeout(() => {
        frames.forEach(frame => frame.classList.add("flown-in"));
      }, 150);
    });

    // subtle 3D tilt following the cursor, Apple-product-page style
    frames.forEach(frame => {
      frame.addEventListener("mousemove", (e) => {
        const rect = frame.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        frame.style.transform = `rotate3d(0,1,0,${px * 10}deg) rotate3d(1,0,0,${-py * 10}deg) scale(1.02)`;
      });
      frame.addEventListener("mouseleave", () => {
        frame.style.transform = "";
      });
    });
  }

  // demo videos: don't autoplay for visitors who asked for reduced motion —
  // they still get controls to play it themselves
  if (prefersReducedMotion) {
    document.querySelectorAll(".deepdive-photos video[autoplay]").forEach((video) => {
      video.removeAttribute("autoplay");
      video.pause();
    });
  }

  // A soft, local highlight gives dense cards depth without turning the page
  // into a field of looping animations. It only runs for precise pointers.
  if (!prefersReducedMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const reactiveCards = document.querySelectorAll(
      ".hero-path, .audience-card, .problem-card, .tier-card, .tier-card-mini, .benefit, .instruction-card, .teaser-tile, .guide-part-card"
    );

    reactiveCards.forEach((card) => {
      card.classList.add("pointer-reactive");
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        card.classList.add("is-pointer-active");
        card.style.setProperty("--pointer-x", `${event.clientX - rect.left}px`);
        card.style.setProperty("--pointer-y", `${event.clientY - rect.top}px`);
      });
      card.addEventListener("pointerleave", () => {
        card.classList.remove("is-pointer-active");
        card.style.removeProperty("--pointer-x");
        card.style.removeProperty("--pointer-y");
      });
    });
  }

});
