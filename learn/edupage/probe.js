(() => {
  const form = document.querySelector("[data-edupage-probe]");
  const result = document.querySelector("[data-probe-result]");
  const grades = document.querySelector("[data-probe-grades]");
  const metrics = document.querySelector("[data-probe-metrics]");
  const loginView = document.querySelector("[data-login-view]");
  const dashboard = document.querySelector("[data-dashboard]");
  const dashboardStatus = document.querySelector("[data-dashboard-status]");
  const subjects = document.querySelector("[data-subject-averages]");
  const timetable = document.querySelector("[data-timetable]");
  const predictSubject = document.querySelector("[data-predict-subject]");
  const predictWeight = document.querySelector("[data-predict-weight]");
  const predictGrade = document.querySelector("[data-predict-grade]");
  const predictTarget = document.querySelector("[data-predict-target]");
  const prediction = document.querySelector("[data-prediction]");
  let currentGrades = [];
  if (!form || !result || !grades || !metrics || !loginView || !dashboard || !subjects || !timetable) return;
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
  const renderSubjects = items => {
    subjects.replaceChildren();
    for (const item of items || []) {
      const row = document.createElement("div");
      const name = document.createElement("strong");
      const count = document.createElement("span");
      const average = document.createElement("b");
      name.textContent = item.subject; count.textContent = `${item.counted} známek`; average.textContent = item.average?.toLocaleString("cs-CZ") ?? "—";
      row.append(name, count, average); subjects.append(row);
    }
    if (!subjects.children.length) subjects.textContent = "Pro výpočet nejsou dostupné číselné známky.";
  };
  const numericGradesFor = subject => currentGrades.filter(item => item.subject === subject && item.kind === "grade" && Number.isInteger(Number(item.value)) && Number(item.value) >= 1 && Number(item.value) <= 5).map(item => ({ value: Number(item.value), weight: Number(item.weight) > 0 ? Number(item.weight) : 1 }));
  const updatePrediction = () => {
    const items = numericGradesFor(predictSubject.value);
    const oldWeight = items.reduce((sum, item) => sum + item.weight, 0);
    const oldPoints = items.reduce((sum, item) => sum + item.value * item.weight, 0);
    const testWeight = Math.max(.05, Number(predictWeight.value) || 1);
    const proposed = Number(predictGrade.value);
    const target = Number(predictTarget.value);
    if (!oldWeight) { prediction.textContent = "Tento předmět zatím nemá číselné známky."; return; }
    const projected = (oldPoints + proposed * testWeight) / (oldWeight + testWeight);
    const needed = (target * (oldWeight + testWeight) - oldPoints) / testWeight;
    const neededText = needed < 1 ? "jedním takovým testem nelze dosáhnout" : needed >= 5 ? "stačí jakákoli známka 1–5" : `potřebuješ ${Math.floor(needed)} nebo lepší`;
    prediction.textContent = `Po známce ${proposed} bude průměr ${projected.toLocaleString("cs-CZ", { maximumFractionDigits: 2 })}. Pro cíl ${target.toLocaleString("cs-CZ")} ${neededText}.`;
  };
  const setupPredictor = averages => {
    predictSubject.replaceChildren();
    for (const item of averages?.subjects || []) { const option = document.createElement("option"); option.value = item.subject; option.textContent = `${item.subject} · ${item.average?.toLocaleString("cs-CZ") ?? "—"}`; predictSubject.append(option); }
    updatePrediction();
  };
  const renderTimetable = data => {
    timetable.replaceChildren();
    const days = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek"];
    const monday = data?.monday ? new Date(`${data.monday}T12:00:00Z`) : null;
    for (let index = 0; index < 5; index += 1) {
      const date = monday ? new Date(monday) : null;
      if (date) date.setUTCDate(monday.getUTCDate() + index);
      const key = date?.toISOString().slice(0, 10);
      const column = document.createElement("div");
      const heading = document.createElement("h3");
      heading.textContent = days[index]; column.append(heading);
      const lessons = (data?.lessons || []).filter(lesson => lesson.date === key);
      for (const lesson of lessons) {
        const card = document.createElement("div");
        if (lesson.cancelled) card.classList.add("is-cancelled");
        const time = document.createElement("span"); const subject = document.createElement("strong"); const room = document.createElement("small");
        time.textContent = lesson.start && lesson.end ? `${lesson.start}–${lesson.end}` : `${lesson.period}. hodina`;
        subject.textContent = lesson.subject; room.textContent = lesson.room || "učebna neuvedena";
        card.append(time, subject, room); column.append(card);
      }
      if (!lessons.length) { const empty = document.createElement("p"); empty.textContent = "Bez výuky"; column.append(empty); }
      timetable.append(column);
    }
    if (!data) timetable.textContent = "Rozvrh se nepodařilo načíst v podporovaném formátu.";
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
        currentGrades = Array.isArray(payload.grades) ? payload.grades : [];
        renderMetrics(payload);
        renderGrades(currentGrades);
        renderSubjects(payload.averages?.subjects);
        setupPredictor(payload.averages);
        renderTimetable(payload.timetable);
        dashboardStatus.textContent = payload.message;
        loginView.hidden = true;
        dashboard.hidden = false;
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch {
      result.className = "edupage-probe-result is-error";
      result.textContent = "Testovací server neodpovídá.";
    } finally {
      form.elements.password.value = "";
      button.disabled = false;
    }
  });
  document.querySelector("[data-dashboard-close]")?.addEventListener("click", () => {
    currentGrades = []; dashboard.hidden = true; loginView.hidden = false; form.reset(); result.textContent = ""; grades.replaceChildren(); metrics.replaceChildren(); subjects.replaceChildren(); timetable.replaceChildren();
  });
  [predictSubject, predictWeight, predictGrade, predictTarget].forEach(control => control?.addEventListener("input", updatePrediction));
})();
