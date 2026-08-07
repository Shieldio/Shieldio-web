// Shieldio — contact form submit via Web3Forms (no page reload)

document.addEventListener("DOMContentLoaded", () => {
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
          if (status) { status.textContent = "Zpráva odeslána, ozveme se co nejdřív."; status.classList.add("success"); }
          form.reset();
        } else {
          if (status) { status.textContent = "Něco se nepovedlo. Zkus to prosím znovu."; status.classList.add("error"); }
        }
      } catch (err) {
        if (status) { status.textContent = "Něco se nepovedlo. Zkus to prosím znovu."; status.classList.add("error"); }
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  });
});
