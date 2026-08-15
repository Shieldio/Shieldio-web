// Shieldio — contact form submit via Web3Forms (no page reload)

document.addEventListener("DOMContentLoaded", () => {
  let overlay;

  function openFormModal(html) {
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "modal-overlay";
      overlay.innerHTML = `<div class="modal-card" id="form-modal-card"></div>`;
      document.body.appendChild(overlay);
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeFormModal();
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeFormModal();
      });
    }
    overlay.querySelector("#form-modal-card").innerHTML = `<button type="button" class="modal-close" aria-label="Zavřít">&times;</button>${html}`;
    overlay.querySelector(".modal-close").addEventListener("click", closeFormModal);
    overlay.classList.add("active");
  }

  function closeFormModal() {
    if (overlay) overlay.classList.remove("active");
  }

  document.querySelectorAll("form.web3form").forEach(form => {
    const submitBtn = form.querySelector('button[type="submit"]');
    const status = form.querySelector(".form-status");
    const originalText = submitBtn.textContent;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      submitBtn.textContent = "Odesílám…";
      submitBtn.disabled = true;
      if (status) { status.textContent = ""; status.classList.remove("error", "success"); }

      try {
        const response = await fetch(form.action, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: new FormData(form),
        });
        const data = await response.json();

        if (response.ok && data.success) {
          openFormModal(`
            <div class="guide-done-check" style="width:56px; height:56px; font-size:26px; margin:0 auto 18px;">✓</div>
            <h3 style="text-align:center;">Zpráva odeslána.</h3>
            <p style="text-align:center;">Díky, ozveme se co nejdřív — obvykle do dvou pracovních dnů.</p>
            <button type="button" class="btn btn-primary" style="width:100%; justify-content:center; margin-top:8px;" data-modal-ok>Zavřít</button>
          `);
          overlay.querySelector("[data-modal-ok]").addEventListener("click", closeFormModal);
          if (status) { status.textContent = "✓ Zpráva odeslána, ozveme se co nejdřív."; status.classList.add("success"); }
          form.reset();
        } else {
          openFormModal(`
            <div class="guide-done-check error" style="width:56px; height:56px; font-size:26px; margin:0 auto 18px;">✕</div>
            <h3 style="text-align:center;">Něco se nepovedlo.</h3>
            <p style="text-align:center;">Zkus to prosím znovu, nebo nám napiš přímo na <a href="mailto:info@shieldio.cz">info@shieldio.cz</a>.</p>
            <button type="button" class="btn btn-primary" style="width:100%; justify-content:center; margin-top:8px;" data-modal-ok>Zavřít</button>
          `);
          overlay.querySelector("[data-modal-ok]").addEventListener("click", closeFormModal);
          if (status) { status.textContent = "✕ Něco se nepovedlo. Zkus to prosím znovu."; status.classList.add("error"); }
        }
      } catch (err) {
        openFormModal(`
          <div class="guide-done-check error" style="width:56px; height:56px; font-size:26px; margin:0 auto 18px;">✕</div>
          <h3 style="text-align:center;">Něco se nepovedlo.</h3>
          <p style="text-align:center;">Zkus to prosím znovu, nebo nám napiš přímo na <a href="mailto:info@shieldio.cz">info@shieldio.cz</a>.</p>
          <button type="button" class="btn btn-primary" style="width:100%; justify-content:center; margin-top:8px;" data-modal-ok>Zavřít</button>
        `);
        overlay.querySelector("[data-modal-ok]").addEventListener("click", closeFormModal);
        if (status) { status.textContent = "✕ Něco se nepovedlo. Zkus to prosím znovu."; status.classList.add("error"); }
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  });
});
