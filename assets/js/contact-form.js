// Shared contact feedback; failed requests retain entered text.
document.addEventListener("DOMContentLoaded", () => {
  let overlay, previousFocus, modalState;
  const english = () => document.documentElement.lang === "en";
  const tx = (cs, en) => english() ? en : cs;
  function close() {overlay?.classList.remove("active"); previousFocus?.focus();}
  function paintModal() {
    if (!overlay) return;
    const success = modalState === "success";
    const title = success ? tx("Zpráva odeslána", "Message sent") : tx("Zprávu se nepodařilo odeslat", "Message could not be sent");
    const body = success ? tx("Děkujeme za zprávu.", "Thank you for your message.") : tx('Zkus to znovu nebo napiš na <a href="mailto:info@shieldio.cz">info@shieldio.cz</a>.', 'Try again or email <a href="mailto:info@shieldio.cz">info@shieldio.cz</a>.');
    overlay.querySelector(".modal-card").innerHTML = '<button type="button" class="modal-close" aria-label="' + tx("Zavřít","Close") + '">&times;</button><h3 id="form-feedback-title">' + title + '</h3><p>' + body + '</p><button type="button" class="btn btn-primary" data-modal-ok>' + tx("Zavřít","Close") + '</button>';
    overlay.querySelectorAll("button").forEach(button => button.addEventListener("click", close));
  }
  function show(state, returnTarget) {
    previousFocus = returnTarget || document.activeElement; modalState = state;
    if (!overlay) {
      overlay = document.createElement("div"); overlay.className = "modal-overlay";
      overlay.setAttribute("role","dialog"); overlay.setAttribute("aria-modal","true"); overlay.setAttribute("aria-labelledby","form-feedback-title");
      overlay.innerHTML = '<div class="modal-card"></div>'; document.body.appendChild(overlay);
      overlay.addEventListener("click", event => {if (event.target === overlay) close();});
      document.addEventListener("keydown", event => {
        if (!overlay.classList.contains("active")) return;
        if (event.key === "Escape") close();
        if (event.key === "Tab") {
          const nodes = [...overlay.querySelectorAll("button,a[href]")], first = nodes[0], last = nodes.at(-1);
          if (event.shiftKey && document.activeElement === first) {event.preventDefault(); last.focus();}
          else if (!event.shiftKey && document.activeElement === last) {event.preventDefault(); first.focus();}
        }
      });
    }
    paintModal(); overlay.classList.add("active"); overlay.querySelector(".modal-close").focus();
  }
  document.addEventListener("shieldio-lang-change", () => {
    if (overlay?.classList.contains("active")) {paintModal(); overlay.querySelector(".modal-close").focus();}
  });
  document.querySelectorAll("form.web3form").forEach(form => {
    const button = form.querySelector('button[type="submit"]'), status = form.querySelector(".form-status");
    if (!button) return;
    let busy = false, result = null;
    const labels = new Map([[english(), button.textContent]]);
    function paintStatus() {
      if (status) status.textContent = result ? result === "success" ? tx("Zpráva odeslána.", "Message sent.") : tx("Odeslání selhalo. Zkus to znovu.", "Sending failed. Try again.") : "";
    }
    document.addEventListener("shieldio-lang-change", () => {
      if (!busy || button.hasAttribute("data-i18n")) labels.set(english(), button.textContent);
      if (busy) button.textContent = tx("Odesílání…", "Sending…");
      paintStatus();
    });
    form.addEventListener("submit", async event => {
      event.preventDefault(); if (busy) return;
      labels.set(english(), button.textContent); busy = true; result = null;
      button.disabled = true; button.textContent = tx("Odesílání…", "Sending…");
      status?.classList.remove("error","success"); paintStatus();
      try {
        const response = await fetch(form.action, {method:"POST",headers:{Accept:"application/json"},body:new FormData(form)});
        const data = await response.json(); result = response.ok && data.success ? "success" : "error";
        if (result === "success") form.reset();
      } catch {result = "error";}
      finally {
        busy = false; button.disabled = false; button.textContent = labels.get(english()) || [...labels.values()][0];
        status?.classList.add(result); paintStatus(); show(result, button);
      }
    });
  });
});
