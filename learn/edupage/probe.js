(() => {
  const form = document.querySelector("[data-edupage-probe]");
  const result = document.querySelector("[data-probe-result]");
  if (!form || !result) return;
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const button = form.querySelector("button[type=submit]");
    const data = new FormData(form);
    result.className = "edupage-probe-result is-working";
    result.textContent = "Ověřuji spojení…";
    button.disabled = true;
    try {
      const response = await fetch("/api/edupage/probe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ school: data.get("school"), username: data.get("username"), password: data.get("password") }),
      });
      const payload = await response.json();
      result.className = `edupage-probe-result ${payload.ok ? "is-success" : "is-error"}`;
      result.textContent = payload.message;
    } catch {
      result.className = "edupage-probe-result is-error";
      result.textContent = "Testovací server neodpovídá.";
    } finally {
      form.elements.password.value = "";
      button.disabled = false;
    }
  });
})();
