(() => {
  const form = document.querySelector("[data-edupage-probe]");
  const result = document.querySelector("[data-probe-result]");
  const grades = document.querySelector("[data-probe-grades]");
  const metrics = document.querySelector("[data-probe-metrics]");
  if (!form || !result || !grades || !metrics) return;
  const renderMetrics = payload => {
    metrics.replaceChildren();
    const cards = [
      ["Vážený průměr", payload.averages?.overall === null || payload.averages?.overall === undefined ? "—" : payload.averages.overall.toLocaleString("cs-CZ"), payload.averages?.counted ? `z ${payload.averages.counted} číselných známek` : "bez číselných známek"],
      ["Absence", payload.attendance?.current?.percent === null || payload.attendance?.current?.percent === undefined ? "—" : `${payload.attendance.current.percent.toLocaleString("cs-CZ")} %`, payload.attendance?.current ? `${payload.attendance.current.label} · ${payload.attendance.current.absent}/${payload.attendance.current.total} hodin` : "údaj nebyl dostupný"],
    ];
    for (const [label, value, detail] of cards) {
      const card = document.createElement("div");
      const small = document.createElement("span");
      const strong = document.createElement("strong");
      const note = document.createElement("small");
      small.textContent = label; strong.textContent = value; note.textContent = detail;
      card.append(small, strong, note); metrics.append(card);
    }
    metrics.hidden = false;
  };
  const renderGrades = items => {
    grades.replaceChildren();
    if (!items.length) {
      const empty = document.createElement("p");
      empty.textContent = "Účet nevrátil žádné známky.";
      grades.append(empty);
    } else {
      for (const item of items) {
        const row = document.createElement("div");
        const subject = document.createElement("strong");
        const value = document.createElement("b");
        const meta = document.createElement("span");
        subject.textContent = item.subject;
        value.textContent = item.maxPoints ? `${item.value} / ${item.maxPoints}` : item.value;
        meta.textContent = [item.date, item.weight ? `váha ${item.weight}` : null].filter(Boolean).join(" · ");
        row.append(subject, value, meta);
        grades.append(row);
      }
    }
    grades.hidden = false;
  };
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const button = form.querySelector("button[type=submit]");
    const data = new FormData(form);
    result.className = "edupage-probe-result is-working";
    result.textContent = "Ověřuji spojení…";
    button.disabled = true;
    grades.hidden = true;
    metrics.hidden = true;
    try {
      const response = await fetch("/api/edupage/probe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ school: data.get("school"), username: data.get("username"), password: data.get("password") }),
      });
      const payload = await response.json();
      result.className = `edupage-probe-result ${payload.ok ? "is-success" : "is-error"}`;
      result.textContent = payload.message;
      if (payload.ok) {
        renderMetrics(payload);
        renderGrades(Array.isArray(payload.grades) ? payload.grades : []);
      }
    } catch {
      result.className = "edupage-probe-result is-error";
      result.textContent = "Testovací server neodpovídá.";
    } finally {
      form.elements.password.value = "";
      button.disabled = false;
    }
  });
})();
