// Shieldio — click-to-zoom lightbox for any .photo-frame or [data-photo] trigger
// Uses event delegation on document, so it still works even if a trigger's DOM
// node gets recreated later (e.g. lang.js replacing a [data-i18n] element's
// innerHTML after this script already ran).

document.addEventListener("DOMContentLoaded", () => {
  if (!document.querySelector(".photo-frame") && !document.querySelector("[data-photo]")) return;

  let overlay, imgEl, captionEl;

  function ensureOverlay() {
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.className = "modal-overlay lightbox-overlay";
    overlay.innerHTML = `
      <button type="button" class="lightbox-close" aria-label="Zavřít">&times;</button>
      <figure class="lightbox-figure">
        <img class="lightbox-img" alt="">
        <figcaption class="lightbox-caption"></figcaption>
      </figure>
    `;
    document.body.appendChild(overlay);
    imgEl = overlay.querySelector(".lightbox-img");
    captionEl = overlay.querySelector(".lightbox-caption");
    overlay.addEventListener("click", (e) => { if (e.target === overlay) closeLightbox(); });
    overlay.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("active")) closeLightbox();
    });
  }

  function openLightbox(src, alt) {
    ensureOverlay();
    imgEl.src = src;
    imgEl.alt = alt || "";
    captionEl.textContent = alt || "";
    overlay.classList.add("active");
  }

  function closeLightbox() {
    if (overlay) overlay.classList.remove("active");
  }

  document.querySelectorAll(".photo-frame").forEach((frame) => {
    if (!frame.querySelector("img")) return;
    frame.classList.add("zoomable");
    frame.setAttribute("role", "button");
    frame.setAttribute("tabindex", "0");
    frame.setAttribute("aria-label", "Zvětšit fotku");
  });

  document.addEventListener("click", (e) => {
    const photoBtn = e.target.closest("[data-photo]");
    if (photoBtn) {
      e.preventDefault();
      e.stopPropagation();
      openLightbox(photoBtn.dataset.photo, photoBtn.dataset.photoAlt || "");
      return;
    }
    const frame = e.target.closest(".photo-frame.zoomable");
    if (frame) {
      const img = frame.querySelector("img");
      if (img) openLightbox(img.currentSrc || img.src, img.alt);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const frame = e.target.closest && e.target.closest(".photo-frame.zoomable");
    if (frame) {
      e.preventDefault();
      const img = frame.querySelector("img");
      if (img) openLightbox(img.currentSrc || img.src, img.alt);
    }
  });
});
