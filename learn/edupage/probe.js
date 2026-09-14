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
  const attendanceSubjects = document.querySelector("[data-subject-attendance]");
  const attendanceLimit = document.querySelector("[data-attendance-limit]");
  const predictSubject = document.querySelector("[data-predict-subject]");
  const predictCurrent = document.querySelector("[data-predict-current]");
  const predictResult = document.querySelector("[data-predict-result]");
  const futureGrades = document.querySelector("[data-future-grades]");
  const addGrade = document.querySelector("[data-add-grade]");
  const customSchool = document.querySelector("[data-custom-school]");
  let currentGrades = [];
  let currentSubjectAttendance = [];
  if (!form || !result || !grades || !metrics || !loginView || !dashboard || !subjects || !timetable || !attendanceSubjects || !attendanceLimit || !predictSubject || !predictCurrent || !predictResult || !futureGrades || !addGrade) return;
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
  const renderSubjectAttendance = items => {
    currentSubjectAttendance = Array.isArray(items) ? items : [];
    attendanceSubjects.replaceChildren();
    const limit = Math.min(99, Math.max(1, Number(attendanceLimit.value) || 25)) / 100;
    for (const item of currentSubjectAttendance) {
      const row = document.createElement("div"); const name = document.createElement("strong"); const count = document.createElement("span"); const percent = document.createElement("b"); const reserve = document.createElement("small");
      const remaining = item.absent / item.total >= limit ? -1 : Math.max(0, Math.floor(((limit * item.total - item.absent) / (1 - limit)) + 1e-9));
      name.textContent = item.subject; count.textContent = `${item.absent}/${item.total} zameškaných hodin`; percent.textContent = `${item.percent.toLocaleString("cs-CZ")} %`;
      if (remaining < 0) { reserve.textContent = `Na zvolené hranici ${(limit * 100).toLocaleString("cs-CZ")} % nebo nad ní`; row.classList.add("is-danger"); }
      else if (remaining === 0) { reserve.textContent = "Další zameškaná hodina už překročí hranici"; row.classList.add("is-warning"); }
      else { reserve.textContent = `Rezerva: ještě ${remaining} ${remaining === 1 ? "celá hodina" : remaining < 5 ? "celé hodiny" : "celých hodin"}`; if (remaining <= 2) row.classList.add("is-warning"); }
      row.append(name, count, reserve, percent); attendanceSubjects.append(row);
    }
    if (!attendanceSubjects.children.length) attendanceSubjects.textContent = "EduPage neposkytl dost údajů pro spolehlivý výpočet po předmětech.";
  };
  const numericGradesFor = subject => currentGrades.filter(item => item.subject === subject && item.kind === "grade" && Number.isInteger(Number(item.value)) && Number(item.value) >= 1 && Number(item.value) <= 5).map(item => ({ value: Number(item.value), weight: Number(item.weight) > 0 ? Number(item.weight) : 1 }));
  const updatePrediction = () => {
    const items = numericGradesFor(predictSubject.value);
    const oldWeight = items.reduce((sum, item) => sum + item.weight, 0);
    const oldPoints = items.reduce((sum, item) => sum + item.value * item.weight, 0);
    const future = [...futureGrades.querySelectorAll("[data-future-grade]")].map(row => ({ value: Number(row.querySelector("[data-grade]").value), weight: Number(row.querySelector("[data-weight]").value) })).filter(item => item.value >= 1 && item.value <= 5 && item.weight > 0);
    const futureWeight = future.reduce((sum, item) => sum + item.weight, 0);
    const futurePoints = future.reduce((sum, item) => sum + item.value * item.weight, 0);
    const format = value => value === null ? "—" : value.toLocaleString("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const current = oldWeight ? oldPoints / oldWeight : null;
    const projected = oldWeight + futureWeight ? (oldPoints + futurePoints) / (oldWeight + futureWeight) : null;
    predictCurrent.textContent = format(current);
    predictResult.textContent = format(projected);
  };
  const weightOptions = [0.25, 0.5, 1, 2, 3, 5];
  const addFutureGrade = () => {
    const row = document.createElement("div"); row.className = "edupage-future-grade"; row.dataset.futureGrade = "";
    const gradeLabel = document.createElement("label"); gradeLabel.textContent = "Známka";
    const gradeSelect = document.createElement("select"); gradeSelect.dataset.grade = "";
    for (let value = 1; value <= 5; value += 1) { const option = document.createElement("option"); option.value = String(value); option.textContent = String(value); gradeSelect.append(option); }
    gradeLabel.append(gradeSelect);
    const weightLabel = document.createElement("label"); weightLabel.textContent = "Váha";
    const weightSelect = document.createElement("select"); weightSelect.dataset.weight = "";
    for (const value of weightOptions) { const option = document.createElement("option"); option.value = String(value); option.textContent = String(value).replace(".", ","); if (value === 1) option.selected = true; weightSelect.append(option); }
    const custom = document.createElement("option"); custom.value = "custom"; custom.textContent = "Jiná…"; weightSelect.append(custom); weightLabel.append(weightSelect);
    const customWeight = document.createElement("input"); customWeight.type = "number"; customWeight.min = "0.05"; customWeight.max = "100"; customWeight.step = "0.05"; customWeight.placeholder = "Vlastní"; customWeight.hidden = true;
    const remove = document.createElement("button"); remove.type = "button"; remove.className = "edupage-remove-grade"; remove.setAttribute("aria-label", "Odebrat známku"); remove.textContent = "×";
    weightSelect.addEventListener("change", () => { const isCustom = weightSelect.value === "custom"; customWeight.hidden = !isCustom; if (isCustom) { customWeight.dataset.weight = ""; delete weightSelect.dataset.weight; customWeight.focus(); } else { weightSelect.dataset.weight = ""; delete customWeight.dataset.weight; } updatePrediction(); });
    row.addEventListener("input", updatePrediction); remove.addEventListener("click", () => { row.remove(); updatePrediction(); });
    row.append(gradeLabel, weightLabel, customWeight, remove); futureGrades.append(row); updatePrediction();
  };
  const setupPredictor = averages => {
    predictSubject.replaceChildren();
    for (const item of averages?.subjects || []) { const option = document.createElement("option"); option.value = item.subject; option.textContent = item.subject; predictSubject.append(option); }
    futureGrades.replaceChildren(); addFutureGrade();
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
        body: JSON.stringify({ school: data.get("schoolChoice") === "custom" ? data.get("customSchool") : "spszl", username: data.get("username"), password: data.get("password"), privacyConsent: data.get("privacyConsent") === "on" }),
      });
      const payload = await response.json();
      result.className = `edupage-probe-result ${payload.ok ? "is-success" : "is-error"}`;
      result.textContent = payload.message;
      if (payload.ok) {
        currentGrades = Array.isArray(payload.grades) ? payload.grades : [];
        renderMetrics(payload);
        renderGrades(currentGrades);
        renderSubjects(payload.averages?.subjects);
        renderSubjectAttendance(payload.subjectAttendance);
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
    currentGrades = []; currentSubjectAttendance = []; dashboard.hidden = true; loginView.hidden = false; form.reset(); form.elements.schoolChoice.value = "spszl"; customSchool.hidden = true; result.textContent = ""; grades.replaceChildren(); metrics.replaceChildren(); subjects.replaceChildren(); attendanceSubjects.replaceChildren(); futureGrades.replaceChildren(); timetable.replaceChildren();
  });
  predictSubject.addEventListener("change", updatePrediction); addGrade.addEventListener("click", addFutureGrade);
  attendanceLimit.addEventListener("input", () => renderSubjectAttendance(currentSubjectAttendance));
  form.querySelectorAll('[name="schoolChoice"]').forEach(control => control.addEventListener("change", () => { const show = form.elements.schoolChoice.value === "custom"; customSchool.hidden = !show; form.elements.customSchool.required = show; if (show) form.elements.customSchool.focus(); }));
})();
